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
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

// UC-09 Join Additional Organization, CO-09.1
@SpringBootTest
@Transactional
class MembershipServiceTest {

    @Autowired
    private MembershipService membershipService;
    @Autowired
    private RecruiterRepository recruiterRepository;
    @Autowired
    private OrganizationRepository organizationRepository;
    @Autowired
    private OrganizationMembershipRepository membershipRepository;
    @Autowired
    private NotificationRepository notificationRepository;

    private MembershipFixtures fixtures;
    private Recruiter recruiter;
    private Organization target;

    @BeforeEach
    void setUp() {
        fixtures = new MembershipFixtures(recruiterRepository, organizationRepository, membershipRepository);
        recruiter = fixtures.approvedRecruiter();
        target = fixtures.registeredOrganization();
    }

    private OrganizationMembership join() {
        return membershipService.submitMembershipRequest(recruiter.getEmail(), target.getOrganizationId(),
                "Contract recruiter", "We share a hiring team.");
    }

    @Test
    void searchFindsRegisteredOrganizationsByNameOrWebsiteAndNoPendingOnes() {
        Organization pending = fixtures.organization(target.getName() + " Pending", "pending.example",
                OrganizationStatus.PENDING_APPROVAL);

        List<Long> byName = ids(membershipService.searchOrganizations(target.getName().toUpperCase()));
        assertTrue(byName.contains(target.getOrganizationId()));
        assertFalse(byName.contains(pending.getOrganizationId()));
        assertTrue(ids(membershipService.searchOrganizations(target.getWebsite())).contains(target.getOrganizationId()));
    }

    @Test
    void createsAPendingRequestAndNotifiesTheAdministratorAndTheRecruiter() {
        OrganizationMembership request = join();

        assertEquals(MembershipStatus.PENDING, request.getStatus());
        assertEquals(MembershipRequestType.ADDITIONAL_ORGANIZATION, request.getRequestType());
        assertEquals("Contract recruiter", request.getRole());
        assertEquals("We share a hiring team.", request.getJustification());
        assertTrue(membershipService.viewMemberships(recruiter.getEmail()).contains(request));
        assertEquals(NotificationType.REQUEST_CONFIRMATION,
                lastNotification(recruiter).getType());
        assertTrue(notificationRepository.findAll().stream().anyMatch(n -> n.getType() == NotificationType.MEMBERSHIP_REQUEST
                && n.getMessage().contains(target.getName())));
    }

    @Test
    void aMemberIsRefusedWithTheActiveStatus() {
        fixtures.membership(recruiter, target, MembershipStatus.ACTIVE, MembershipRequestType.ADDITIONAL_ORGANIZATION);

        MembershipConflictException refused = assertThrows(MembershipConflictException.class, this::join);

        assertEquals(MembershipStatus.ACTIVE, refused.getStatus());
        assertEquals("You already belong to " + target.getName() + ".", refused.getMessage());
    }

    @Test
    void aSecondRequestIsRefusedWithThePendingStatusAndNothingIsCreated() {
        join();
        long before = membershipRepository.count();

        MembershipConflictException refused = assertThrows(MembershipConflictException.class, this::join);

        assertEquals(MembershipStatus.PENDING, refused.getStatus());
        assertTrue(refused.getMessage().endsWith("Status: Pending."));
        assertEquals(before, membershipRepository.count());
    }

    @Test
    void aDeniedOrCancelledRequestCanBeMadeAgain() {
        fixtures.membership(recruiter, target, MembershipStatus.DENIED, MembershipRequestType.ADDITIONAL_ORGANIZATION);

        assertEquals(MembershipStatus.PENDING, join().getStatus());
    }

    @Test
    void onlyAnApprovedRecruiterWithAnActiveMembershipJoins() {
        Recruiter pending = fixtures.recruiter(AccountStatus.PENDING_APPROVAL);
        Recruiter withoutMembership = fixtures.recruiter(AccountStatus.ACTIVE);

        for (Recruiter refused : List.of(pending, withoutMembership)) {
            assertThrows(RecruiterNotApprovedException.class, () -> membershipService.submitMembershipRequest(
                    refused.getEmail(), target.getOrganizationId(), "Recruiter", "Because."));
        }
    }

    @Test
    void needsARoleAJustificationAndARegisteredOrganization() {
        Organization pending = fixtures.organization("Pending " + System.nanoTime(), "p.example",
                OrganizationStatus.PENDING_APPROVAL);

        MembershipRequestRefusedException refused = assertThrows(MembershipRequestRefusedException.class,
                () -> membershipService.submitMembershipRequest(recruiter.getEmail(), pending.getOrganizationId(), " ", null));

        assertEquals(Set.of("organizationId", "role", "justification"), refused.getFieldErrors().keySet());
    }

    @Test
    void aPendingRequestCanBeCancelledAndLeavesTheMemberships() {
        OrganizationMembership request = join();

        membershipService.cancelMembershipRequest(recruiter.getEmail(), request.getMembershipId());

        assertEquals(MembershipStatus.CANCELLED, request.getStatus());
        assertFalse(membershipService.viewMemberships(recruiter.getEmail()).contains(request));
        assertThrows(MembershipConflictException.class,
                () -> membershipService.cancelMembershipRequest(recruiter.getEmail(), request.getMembershipId()));
        // Another recruiter's request is not theirs to cancel
        OrganizationMembership other = join();
        assertThrows(MembershipNotFoundException.class, () -> membershipService.cancelMembershipRequest(
                fixtures.approvedRecruiter().getEmail(), other.getMembershipId()));
    }

    @Test
    void anUnregisteredOrganizationIsCreatedPendingWithTheRequest() {
        long n = System.nanoTime();
        OrganizationMembership request = membershipService.submitMembershipRequest(recruiter.getEmail(),
                new OrganizationData("Waco Learning Lab " + n, "wacolearning" + n + ".example", "Education",
                        null, null, null),
                "Trainer recruiter", "Shared hiring team.");

        assertEquals(MembershipRequestType.ADDITIONAL_NEW_ORGANIZATION, request.getRequestType());
        assertEquals(OrganizationStatus.PENDING_APPROVAL, request.getOrganization().getOrganizationStatus());
        assertThrows(OrganizationAlreadyRegisteredException.class, () -> membershipService.submitMembershipRequest(
                recruiter.getEmail(), new OrganizationData(target.getName(), "x" + n + ".example", null, null, null, null),
                "Recruiter", "Because."));
    }

    private static List<Long> ids(List<Organization> organizations) {
        return organizations.stream().map(Organization::getOrganizationId).toList();
    }

    private baylor.csi5324.careerbridge.model.Notification lastNotification(Recruiter recipient) {
        var sent = notificationRepository.findByRecipientOrderByNotificationIdAsc(recipient);
        return sent.get(sent.size() - 1);
    }
}
