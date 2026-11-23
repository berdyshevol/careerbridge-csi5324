package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.MembershipRequestType;
import baylor.csi5324.careerbridge.model.MembershipStatus;
import baylor.csi5324.careerbridge.model.NotificationType;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.OrganizationMembership;
import baylor.csi5324.careerbridge.model.OrganizationStatus;
import baylor.csi5324.careerbridge.model.Recruiter;
import baylor.csi5324.careerbridge.repository.OrganizationMembershipRepository;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import baylor.csi5324.careerbridge.repository.RecruiterRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

// UC-09 Join Additional Organization, CO-09.1
@Service
@Transactional
public class MembershipService {

    private static final int MAX_SEARCH_RESULTS = 20;
    private static final int MAX_JUSTIFICATION_LENGTH = 2000;

    private final RecruiterRepository recruiterRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationMembershipRepository membershipRepository;
    private final NotificationService notificationService;
    private final Clock clock;

    public MembershipService(RecruiterRepository recruiterRepository, OrganizationRepository organizationRepository,
                             OrganizationMembershipRepository membershipRepository,
                             NotificationService notificationService, Clock clock) {
        this.recruiterRepository = recruiterRepository;
        this.organizationRepository = organizationRepository;
        this.membershipRepository = membershipRepository;
        this.notificationService = notificationService;
        this.clock = clock;
    }

    // Steps 2-3: a read of the registered organizations, by name or website domain (variation 3a)
    @Transactional(readOnly = true)
    public List<Organization> searchOrganizations(String query) {
        String text = query == null ? "" : query.strip().toLowerCase(Locale.ROOT);
        return organizationRepository.findAll().stream()
                .filter(Organization::isRegistered)
                .filter(organization -> text.isEmpty()
                        || organization.getName().toLowerCase(Locale.ROOT).contains(text)
                        || organization.getWebsite() != null
                        && organization.getWebsite().toLowerCase(Locale.ROOT).contains(text))
                .sorted(Comparator.comparing(organization -> organization.getName().toLowerCase(Locale.ROOT)))
                .limit(MAX_SEARCH_RESULTS)
                .toList();
    }

    // Steps 4 and 8; a cancelled request is no longer one of the recruiter's memberships (*a)
    @Transactional(readOnly = true)
    public List<OrganizationMembership> viewMemberships(String recruiterEmail) {
        return recruiterRepository.findByEmailIgnoreCase(recruiterEmail).stream()
                .flatMap(recruiter -> membershipRepository.findByRecruiterOrderByRequestedAtAscMembershipIdAsc(recruiter).stream())
                .filter(membership -> membership.getStatus() != MembershipStatus.CANCELLED)
                .toList();
    }

    // CO-09.1
    public OrganizationMembership submitMembershipRequest(String recruiterEmail, Long organizationId,
                                                          String role, String justification) {
        Recruiter recruiter = approvedRecruiter(recruiterEmail);
        Map<String, String> errors = new LinkedHashMap<>();
        Organization organization = organizationId == null ? null
                : organizationRepository.findById(organizationId).filter(Organization::isRegistered).orElse(null);
        if (organization == null) {
            errors.put("organizationId", "Choose a registered organization.");
        }
        OrganizationMembership request = newRequest(recruiter, organization,
                MembershipRequestType.ADDITIONAL_ORGANIZATION, role, justification, errors);
        refuseSecondMembership(recruiter, organization);
        return send(request);
    }

    // Extension 3a: the organization is not registered, so the request also asks for it
    public OrganizationMembership submitMembershipRequest(String recruiterEmail, OrganizationData organizationData,
                                                          String role, String justification) {
        Recruiter recruiter = approvedRecruiter(recruiterEmail);
        Map<String, String> errors = new LinkedHashMap<>();
        Organization organization = OrganizationRules.newOrganization(organizationData, errors);
        OrganizationMembership request = newRequest(recruiter, organization,
                MembershipRequestType.ADDITIONAL_NEW_ORGANIZATION, role, justification, errors);
        OrganizationRules.rejectDuplicate(organization, organizationRepository);
        request.setOrganization(organizationRepository.save(organization));
        return send(request);
    }

    // Extension *a
    public OrganizationMembership cancelMembershipRequest(String recruiterEmail, Long membershipId) {
        Recruiter recruiter = recruiter(recruiterEmail);
        OrganizationMembership membership = membershipRepository.lockById(membershipId)
                .filter(found -> Objects.equals(found.getRecruiter().getUserId(), recruiter.getUserId()))
                .orElseThrow(() -> new MembershipNotFoundException(membershipId));
        if (!membership.getStatus().isAwaitingDecision()) {
            throw new MembershipConflictException(membership.getStatus(), "This request is "
                    + membership.getStatus().getLabel() + " and can no longer be cancelled.");
        }
        membership.setStatus(MembershipStatus.CANCELLED);
        if (membership.getRequestType().createsOrganization()) {
            membership.getOrganization().setOrganizationStatus(OrganizationStatus.INACTIVE);
        }
        return membership;
    }

    private OrganizationMembership newRequest(Recruiter recruiter, Organization organization,
                                              MembershipRequestType type, String role, String justification,
                                              Map<String, String> errors) {
        String checkedRole = AccountRules.required(role, "role", "Your role", AccountRules.MAX_FIELD_LENGTH, errors);
        String checkedJustification = AccountRules.required(justification, "justification", "A justification",
                MAX_JUSTIFICATION_LENGTH, errors);
        if (!errors.isEmpty()) {
            throw new MembershipRequestRefusedException(errors);
        }
        OrganizationMembership request = new OrganizationMembership(recruiter, organization,
                MembershipStatus.PENDING, type, clock.instant());
        request.setRole(checkedRole);
        request.setJustification(checkedJustification);
        return request;
    }

    // Step 6, extensions 6a and 6b
    private void refuseSecondMembership(Recruiter recruiter, Organization organization) {
        for (OrganizationMembership existing : membershipRepository.findByRecruiterOrderByRequestedAtAscMembershipIdAsc(recruiter)) {
            if (!Objects.equals(existing.getOrganization().getOrganizationId(), organization.getOrganizationId())) {
                continue;
            }
            if (existing.getStatus() == MembershipStatus.ACTIVE) {
                throw new MembershipConflictException(MembershipStatus.ACTIVE,
                        "You already belong to " + organization.getName() + ".");
            }
            if (existing.getStatus().isOpenRequest()) {
                throw new MembershipConflictException(existing.getStatus(), "You already asked to join "
                        + organization.getName() + ". Status: " + existing.getStatus().getLabel() + ".");
            }
        }
    }

    // Step 7
    private OrganizationMembership send(OrganizationMembership request) {
        OrganizationMembership saved = membershipRepository.save(request);
        String requester = RecruiterRegistrationService.fullName(saved.getRecruiter());
        String organization = saved.getOrganization().getName();
        notificationService.notifyAdministrators(NotificationType.MEMBERSHIP_REQUEST,
                requester + " asks to join " + organization + ".");
        notificationService.notify(saved.getRecruiter(), NotificationType.REQUEST_CONFIRMATION,
                "Your request to join " + organization + " is waiting for the administrator.");
        return saved;
    }

    // CO-09.1 preconditions. Locked, so two requests at once from one recruiter are checked in turn (6b)
    private Recruiter approvedRecruiter(String email) {
        Recruiter recruiter = recruiterRepository.lockByEmail(email).orElseThrow(RecruiterNotApprovedException::new);
        boolean approved = recruiter.getAccountStatus() == AccountStatus.ACTIVE
                && !membershipRepository.findByRecruiterAndStatus(recruiter, MembershipStatus.ACTIVE).isEmpty();
        if (!approved) {
            throw new RecruiterNotApprovedException();
        }
        return recruiter;
    }

    private Recruiter recruiter(String email) {
        return recruiterRepository.findByEmailIgnoreCase(email).orElseThrow(RecruiterNotApprovedException::new);
    }
}
