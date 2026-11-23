package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.MembershipRequestType;
import baylor.csi5324.careerbridge.model.MembershipStatus;
import baylor.csi5324.careerbridge.model.NotificationType;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.OrganizationMembership;
import baylor.csi5324.careerbridge.model.OrganizationStatus;
import baylor.csi5324.careerbridge.model.Recruiter;
import baylor.csi5324.careerbridge.repository.NotificationRepository;
import baylor.csi5324.careerbridge.repository.OrganizationMembershipRepository;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import baylor.csi5324.careerbridge.repository.RecruiterRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

// UC-10 Approve Recruiter/Organization Request, CO-10.1
@SpringBootTest
@Transactional
class MembershipApprovalServiceTest {

    private static final String ADMINISTRATOR = "admin@careerbridge.example";

    @Autowired
    private MembershipApprovalService approvalService;
    @Autowired
    private RecruiterRepository recruiterRepository;
    @Autowired
    private OrganizationRepository organizationRepository;
    @Autowired
    private OrganizationMembershipRepository membershipRepository;
    @Autowired
    private NotificationRepository notificationRepository;

    private MembershipFixtures fixtures;
    private Recruiter newRecruiter;
    private Organization newOrganization;
    private OrganizationMembership firstRequest;

    @BeforeEach
    void setUp() {
        fixtures = new MembershipFixtures(recruiterRepository, organizationRepository, membershipRepository);
        newRecruiter = fixtures.recruiter(AccountStatus.PENDING_APPROVAL);
        long n = System.nanoTime();
        newOrganization = fixtures.organization("New Org " + n, "neworg" + n + ".example", OrganizationStatus.PENDING_APPROVAL);
        firstRequest = fixtures.membership(newRecruiter, newOrganization, MembershipStatus.PENDING,
                MembershipRequestType.NEW_RECRUITER_NEW_ORGANIZATION);
    }

    @Test
    void theQueueHoldsVerifiedUndecidedRequestsOldestFirst() {
        OrganizationMembership unverified = fixtures.membership(fixtures.recruiter(AccountStatus.PENDING_APPROVAL),
                fixtures.registeredOrganization(), MembershipStatus.AWAITING_VERIFICATION,
                MembershipRequestType.NEW_RECRUITER_EXISTING_ORGANIZATION);
        OrganizationMembership later = fixtures.membership(fixtures.approvedRecruiter(), fixtures.registeredOrganization(),
                MembershipStatus.INFORMATION_REQUESTED, MembershipRequestType.ADDITIONAL_ORGANIZATION);

        List<OrganizationMembership> queue = approvalService.openApprovalQueue();

        assertFalse(queue.contains(unverified));
        assertTrue(queue.indexOf(firstRequest) < queue.indexOf(later));
        assertTrue(queue.stream().allMatch(request -> request.getStatus().isAwaitingDecision()));
    }

    @Test
    void approvingAFirstRequestActivatesTheRecruiterTheOrganizationAndTheMembership() {
        OrganizationMembership approved = approvalService.approveRequest(firstRequest.getMembershipId(), ADMINISTRATOR);

        assertEquals(MembershipStatus.ACTIVE, approved.getStatus());
        assertNotNull(approved.getApprovedAt());
        assertEquals(ADMINISTRATOR, approved.getDecidedBy());
        assertEquals(AccountStatus.ACTIVE, newRecruiter.getAccountStatus());
        assertEquals(OrganizationStatus.ACTIVE, newOrganization.getOrganizationStatus());
        assertEquals(NotificationType.REQUEST_APPROVED,
                lastNotification(newRecruiter).getType());
        assertFalse(approvalService.openApprovalQueue().contains(approved));
    }

    @Test
    void approvingAnAdditionalOrganizationActivatesOnlyTheMembership() {
        Recruiter recruiter = fixtures.approvedRecruiter();
        Organization registered = fixtures.registeredOrganization();
        OrganizationMembership request = fixtures.membership(recruiter, registered, MembershipStatus.PENDING,
                MembershipRequestType.ADDITIONAL_ORGANIZATION);

        approvalService.approveRequest(request.getMembershipId(), ADMINISTRATOR);

        assertEquals(MembershipStatus.ACTIVE, request.getStatus());
        assertEquals(AccountStatus.ACTIVE, recruiter.getAccountStatus());
        assertEquals(OrganizationStatus.ACTIVE, registered.getOrganizationStatus());
    }

    @Test
    void aNewOrganizationThatDuplicatesARegisteredOneIsDeletedAndTheMembershipMoves() {
        Organization registered = fixtures.organization("Registered " + System.nanoTime(), newOrganization.getWebsite(),
                OrganizationStatus.ACTIVE);
        Long duplicateId = newOrganization.getOrganizationId();
        assertEquals(registered.getOrganizationId(),
                approvalService.selectRequest(firstRequest.getMembershipId()).duplicateOf().getOrganizationId());

        OrganizationMembership approved = approvalService.approveRequest(firstRequest.getMembershipId(), ADMINISTRATOR);
        organizationRepository.flush();

        assertEquals(registered.getOrganizationId(), approved.getOrganization().getOrganizationId());
        assertTrue(organizationRepository.findById(duplicateId).isEmpty());
        assertEquals(MembershipStatus.ACTIVE, approved.getStatus());
    }

    @Test
    void aRequestAlreadyDecidedOrCancelledIsAConflictWithItsStatus() {
        approvalService.approveRequest(firstRequest.getMembershipId(), ADMINISTRATOR);
        OrganizationMembership cancelled = fixtures.membership(fixtures.approvedRecruiter(), fixtures.registeredOrganization(),
                MembershipStatus.CANCELLED, MembershipRequestType.ADDITIONAL_ORGANIZATION);

        MembershipConflictException decided = assertThrows(MembershipConflictException.class,
                () -> approvalService.approveRequest(firstRequest.getMembershipId(), "other-admin@careerbridge.example"));
        assertEquals(MembershipStatus.ACTIVE, decided.getStatus());
        assertEquals("This request is now Approved. Nothing was changed.", decided.getMessage());
        assertEquals(ADMINISTRATOR, firstRequest.getDecidedBy());

        MembershipConflictException gone = assertThrows(MembershipConflictException.class,
                () -> approvalService.approveRequest(cancelled.getMembershipId(), ADMINISTRATOR));
        assertEquals(MembershipStatus.CANCELLED, gone.getStatus());
        assertThrows(MembershipConflictException.class,
                () -> approvalService.denyRequest(cancelled.getMembershipId(), ADMINISTRATOR, "Too late"));
    }

    @Test
    void anUnknownRequestIsNotFound() {
        assertThrows(MembershipNotFoundException.class, () -> approvalService.approveRequest(-1L, ADMINISTRATOR));
    }

    @Test
    void denyingNeedsAReasonAndLeavesWhatTheRequestCreatedInactive() {
        assertThrows(MembershipRequestRefusedException.class,
                () -> approvalService.denyRequest(firstRequest.getMembershipId(), ADMINISTRATOR, " "));
        assertEquals(MembershipStatus.PENDING, firstRequest.getStatus());

        approvalService.denyRequest(firstRequest.getMembershipId(), ADMINISTRATOR, "We could not confirm the company.");

        assertEquals(MembershipStatus.DENIED, firstRequest.getStatus());
        assertEquals("We could not confirm the company.", firstRequest.getDecisionNote());
        assertEquals(AccountStatus.INACTIVE, newRecruiter.getAccountStatus());
        assertEquals(OrganizationStatus.INACTIVE, newOrganization.getOrganizationStatus());
        assertTrue(lastNotification(newRecruiter)
                .getMessage().endsWith("We could not confirm the company."));
    }

    @Test
    void askingForInformationKeepsTheRequestInTheQueue() {
        approvalService.requestInformation(firstRequest.getMembershipId(), ADMINISTRATOR, "Write from your work address.");

        assertEquals(MembershipStatus.INFORMATION_REQUESTED, firstRequest.getStatus());
        assertTrue(approvalService.openApprovalQueue().contains(firstRequest));
        assertNull(firstRequest.getApprovedAt());
        // And it can still be approved
        approvalService.approveRequest(firstRequest.getMembershipId(), ADMINISTRATOR);
        assertEquals(MembershipStatus.ACTIVE, firstRequest.getStatus());
    }

    private baylor.csi5324.careerbridge.model.Notification lastNotification(Recruiter recipient) {
        var sent = notificationRepository.findByRecipientOrderByNotificationIdAsc(recipient);
        return sent.get(sent.size() - 1);
    }
}
