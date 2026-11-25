package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.MembershipStatus;
import baylor.csi5324.careerbridge.model.NotificationType;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.OrganizationMembership;
import baylor.csi5324.careerbridge.model.OrganizationStatus;
import baylor.csi5324.careerbridge.model.Recruiter;
import baylor.csi5324.careerbridge.repository.OrganizationMembershipRepository;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

// UC-10 Approve Recruiter/Organization Request, CO-10.1. Only the Administrator reaches it (/api/admin/**).
@Service
@Transactional
public class MembershipApprovalService {

    private static final int MAX_NOTE_LENGTH = 2000;

    private final OrganizationMembershipRepository membershipRepository;
    private final OrganizationRepository organizationRepository;
    private final NotificationService notificationService;
    private final Clock clock;

    public MembershipApprovalService(OrganizationMembershipRepository membershipRepository,
                                     OrganizationRepository organizationRepository,
                                     NotificationService notificationService, Clock clock) {
        this.membershipRepository = membershipRepository;
        this.organizationRepository = organizationRepository;
        this.notificationService = notificationService;
        this.clock = clock;
    }

    // Step 2: oldest first. A request whose email is not verified is not in it yet (UC-08 step 7).
    @Transactional(readOnly = true)
    public List<OrganizationMembership> openApprovalQueue() {
        return membershipRepository.findByStatusInOrderByRequestedAtAscMembershipIdAsc(
                List.of(MembershipStatus.PENDING, MembershipStatus.INFORMATION_REQUESTED));
    }

    // Step 4
    @Transactional(readOnly = true)
    public MembershipRequestDetails selectRequest(Long requestId) {
        OrganizationMembership request = membershipRepository.findById(requestId)
                .orElseThrow(() -> new MembershipNotFoundException(requestId));
        List<OrganizationMembership> others = membershipRepository
                .findByRecruiterOrderByRequestedAtAscMembershipIdAsc(request.getRecruiter()).stream()
                .filter(membership -> !Objects.equals(membership.getMembershipId(), requestId))
                .filter(membership -> membership.getStatus() == MembershipStatus.ACTIVE
                        || membership.getStatus().isOpenRequest())
                .toList();
        return new MembershipRequestDetails(request, others, duplicateOf(request.getOrganization()).orElse(null));
    }

    // CO-10.1
    public OrganizationMembership approveRequest(Long requestId, String administrator) {
        OrganizationMembership request = undecided(requestId);
        Organization organization = request.getOrganization();
        if (organization.getOrganizationStatus() == OrganizationStatus.PENDING_APPROVAL) {
            Optional<Organization> registered = duplicateOf(organization);
            if (registered.isPresent()) {
                // Extension 5c: every request for the duplicate now asks for the registered organization
                for (OrganizationMembership membership : membershipRepository.findByOrganization(organization)) {
                    membership.setOrganization(registered.get());
                }
                request.setOrganization(registered.get());
                organizationRepository.delete(organization);
            } else {
                organization.setOrganizationStatus(OrganizationStatus.ACTIVE);
            }
        }
        Recruiter recruiter = request.getRecruiter();
        if (recruiter.getAccountStatus() == AccountStatus.PENDING_APPROVAL) {
            recruiter.setAccountStatus(AccountStatus.ACTIVE);
        }
        request.approve(administrator, clock.instant());
        notificationService.notify(recruiter, NotificationType.REQUEST_APPROVED,
                "Your request to recruit for " + request.getOrganization().getName() + " was approved. Log in to start.");
        return request;
    }

    // Extension 5a: an account or organization created only for this request stays inactive
    public OrganizationMembership denyRequest(Long requestId, String administrator, String reason) {
        String checked = note(reason, "reason", "A reason");
        OrganizationMembership request = undecided(requestId);
        request.recordDecision(MembershipStatus.DENIED, administrator, clock.instant(), checked);
        Organization organization = request.getOrganization();
        if (organization.getOrganizationStatus() == OrganizationStatus.PENDING_APPROVAL
                && membershipRepository.findByOrganization(organization).stream()
                .noneMatch(membership -> membership.getStatus() == MembershipStatus.ACTIVE
                        || membership.getStatus().isOpenRequest())) {
            organization.setOrganizationStatus(OrganizationStatus.INACTIVE);
        }
        Recruiter recruiter = request.getRecruiter();
        if (recruiter.getAccountStatus() == AccountStatus.PENDING_APPROVAL
                && membershipRepository.findByRecruiterOrderByRequestedAtAscMembershipIdAsc(recruiter).stream()
                .noneMatch(membership -> membership.getStatus().isOpenRequest())) {
            recruiter.setAccountStatus(AccountStatus.INACTIVE);
        }
        notificationService.notify(recruiter, NotificationType.REQUEST_DENIED,
                "Your request to recruit for " + organization.getName() + " was denied: " + checked);
        return request;
    }

    // Extension 5b: the request stays in the queue, marked Information Requested
    public OrganizationMembership requestInformation(Long requestId, String administrator, String question) {
        String checked = note(question, "question", "A question");
        OrganizationMembership request = undecided(requestId);
        Instant now = clock.instant();
        request.recordDecision(MembershipStatus.INFORMATION_REQUESTED, administrator, now, checked);
        notificationService.notify(request.getRecruiter(), NotificationType.INFORMATION_REQUESTED,
                "The administrator asks about your request for " + request.getOrganization().getName() + ": " + checked);
        return request;
    }

    // Extension 6a. Locked, so a second Administrator waits and then finds the request decided.
    private OrganizationMembership undecided(Long requestId) {
        OrganizationMembership request = membershipRepository.lockById(requestId)
                .orElseThrow(() -> new MembershipNotFoundException(requestId));
        if (!request.getStatus().isAwaitingDecision()) {
            // An Active membership is what the Administrator knows as an Approved request
            String now = request.getStatus() == MembershipStatus.ACTIVE ? "Approved" : request.getStatus().getLabel();
            throw new MembershipConflictException(request.getStatus(), "This request is now " + now + ". Nothing was changed.");
        }
        return request;
    }

    private Optional<Organization> duplicateOf(Organization organization) {
        if (organization.getOrganizationStatus() != OrganizationStatus.PENDING_APPROVAL) {
            return Optional.empty();
        }
        return OrganizationRules.registeredDuplicate(organization, organizationRepository.findAll());
    }

    private static String note(String text, String field, String label) {
        Map<String, String> errors = new LinkedHashMap<>();
        String checked = AccountRules.required(text, field, label, MAX_NOTE_LENGTH, errors);
        if (!errors.isEmpty()) {
            throw new MembershipRequestRefusedException(errors);
        }
        return checked;
    }
}
