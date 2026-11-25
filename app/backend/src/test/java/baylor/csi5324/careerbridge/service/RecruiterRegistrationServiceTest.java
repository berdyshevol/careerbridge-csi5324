package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.MembershipRequestType;
import baylor.csi5324.careerbridge.model.MembershipStatus;
import baylor.csi5324.careerbridge.model.Notification;
import baylor.csi5324.careerbridge.model.NotificationType;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.OrganizationMembership;
import baylor.csi5324.careerbridge.model.OrganizationStatus;
import baylor.csi5324.careerbridge.model.Recruiter;
import baylor.csi5324.careerbridge.repository.NotificationRepository;
import baylor.csi5324.careerbridge.repository.OrganizationMembershipRepository;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import baylor.csi5324.careerbridge.repository.RecruiterRepository;
import baylor.csi5324.careerbridge.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

// UC-08 Register Recruiter and Organization, CO-08.1 and CO-08.2
@SpringBootTest
@Transactional
class RecruiterRegistrationServiceTest {

    @Autowired
    private RecruiterRegistrationService registrationService;
    @Autowired
    private MembershipApprovalService approvalService;
    @Autowired
    private LogInService logInService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RecruiterRepository recruiterRepository;
    @Autowired
    private OrganizationRepository organizationRepository;
    @Autowired
    private OrganizationMembershipRepository membershipRepository;
    @Autowired
    private NotificationRepository notificationRepository;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private PasswordEncoder passwordEncoder;

    private MembershipFixtures fixtures;
    private long n;

    @BeforeEach
    void setUp() {
        fixtures = new MembershipFixtures(recruiterRepository, organizationRepository, membershipRepository);
        n = System.nanoTime();
    }

    private RecruiterData lee() {
        return new RecruiterData("Lee Huang", "HR manager", "lee." + n + "@wacofreight" + n + ".example",
                "(254) 555-0182", "Sunrise-2026x");
    }

    private OrganizationData wacoFreight() {
        return new OrganizationData("Waco Freight " + n + " Co.", "https://www.wacofreight" + n + ".example/about",
                "Logistics", "Waco, TX", "51-200 people", "Regional trucking and warehousing.");
    }

    private RecruiterRegistration register() {
        return registrationService.submitRecruiterRegistration(lee(), wacoFreight(), null);
    }

    private static String token(RecruiterRegistration registration) {
        return registration.verificationLink().substring(RecruiterRegistrationService.VERIFY_PATH.length());
    }

    @Test
    void createsThePendingRecruiterOrganizationAndMembershipAndAsksForVerification() {
        RecruiterRegistration registration = register();
        OrganizationMembership membership = registration.membership();

        Recruiter recruiter = membership.getRecruiter();
        assertEquals("Lee", recruiter.getFirstName());
        assertEquals("Huang", recruiter.getLastName());
        assertEquals("HR manager", recruiter.getJobTitle());
        assertEquals(AccountStatus.PENDING_APPROVAL, recruiter.getAccountStatus());
        assertFalse(recruiter.isEmailVerified());
        assertEquals(OrganizationStatus.PENDING_APPROVAL, membership.getOrganization().getOrganizationStatus());
        assertEquals("Logistics", membership.getOrganization().getIndustry());
        assertEquals(MembershipStatus.AWAITING_VERIFICATION, membership.getStatus());
        assertEquals(MembershipRequestType.NEW_RECRUITER_NEW_ORGANIZATION, membership.getRequestType());
        assertNotNull(membership.getRequestedAt());
        assertNull(membership.getReviewFlag());
        List<Notification> sent = notificationRepository.findByRecipientOrderByNotificationIdAsc(recruiter);
        assertEquals(NotificationType.EMAIL_VERIFICATION, sent.get(0).getType());
        // Only the hash of the emailed token is stored
        assertFalse(recruiter.getVerificationTokenHash().contains(token(registration)));
    }

    @Test
    void onlyAVerifiedRequestReachesTheAdministratorsQueue() {
        RecruiterRegistration registration = register();
        Long requestId = registration.membership().getMembershipId();
        assertFalse(queued(requestId));

        Recruiter verified = registrationService.verifyRecruiterEmail(token(registration));

        assertTrue(verified.isEmailVerified());
        assertEquals(MembershipStatus.PENDING, membershipRepository.findById(requestId).orElseThrow().getStatus());
        assertTrue(queued(requestId));
        // The link works once
        assertThrows(VerificationLinkException.class, () -> registrationService.verifyRecruiterEmail(token(registration)));
    }

    @Test
    void refusesEveryInvalidFieldAtOnce() {
        RegistrationRefusedException refused = assertThrows(RegistrationRefusedException.class,
                () -> registrationService.submitRecruiterRegistration(
                        new RecruiterData("Lee", " ", "not-an-email", null, "short"),
                        new OrganizationData(" ", "not a website", null, null, null, null), null));

        assertEquals(Set.of("fullName", "jobTitle", "email", "password", "organization.name", "organization.website"),
                refused.getFieldErrors().keySet());
        assertEquals("Website is required.", assertThrows(RegistrationRefusedException.class,
                () -> registrationService.submitRecruiterRegistration(lee(),
                        new OrganizationData("Some Org " + n, "", null, null, null, null), null))
                .getFieldErrors().get("organization.website"));
    }

    @Test
    void anEmailAlreadyRegisteredCreatesNoAccountAndPointsAnApprovedRecruiterToJoining() {
        AlreadyRegisteredException applicant = assertThrows(AlreadyRegisteredException.class,
                () -> registrationService.submitRecruiterRegistration(
                        new RecruiterData("Jordan Lee", "Lead", "Jordan.Lee@example.com", null, "Sunrise-2026x"),
                        wacoFreight(), null));
        assertEquals("An account already exists for this email address. Log in instead.", applicant.getMessage());

        Recruiter approved = fixtures.approvedRecruiter();
        AlreadyRegisteredException recruiter = assertThrows(AlreadyRegisteredException.class,
                () -> registrationService.submitRecruiterRegistration(
                        new RecruiterData("Sam Ortiz", "Lead", approved.getEmail(), null, "Sunrise-2026x"),
                        wacoFreight(), null));
        assertTrue(recruiter.getMessage().contains("join an additional organization"));
        assertTrue(organizationRepository.findByName(wacoFreight().name()).isEmpty());
    }

    @Test
    void aRegisteredOrganizationIsOfferedAndJoinedInsteadOfDuplicated() {
        Organization registered = fixtures.organization("Waco Freight " + n + " Company, Inc.",
                "wacofreight" + n + ".example", OrganizationStatus.ACTIVE);
        long organizationsBefore = organizationRepository.count();

        // Extension 4c: the same legal name once normalized
        OrganizationAlreadyRegisteredException offered = assertThrows(OrganizationAlreadyRegisteredException.class,
                this::register);
        assertEquals(registered.getOrganizationId(), offered.getOrganization().getOrganizationId());
        assertTrue(userRepository.findByEmailIgnoreCase(lee().email()).isEmpty());

        OrganizationMembership joined = registrationService
                .submitRecruiterRegistration(lee(), null, registered.getOrganizationId()).membership();

        assertEquals(organizationsBefore, organizationRepository.count());
        assertEquals(registered.getOrganizationId(), joined.getOrganization().getOrganizationId());
        assertEquals(MembershipStatus.AWAITING_VERIFICATION, joined.getStatus());
        assertEquals(MembershipRequestType.NEW_RECRUITER_EXISTING_ORGANIZATION, joined.getRequestType());
    }

    @Test
    void anOrganizationWithTheSameWebsiteDomainIsADuplicateToo() {
        fixtures.organization("Another Name " + n, "http://wacofreight" + n + ".example", OrganizationStatus.ACTIVE);

        assertThrows(OrganizationAlreadyRegisteredException.class, this::register);
    }

    @Test
    void aWorkEmailFromAnotherDomainIsAcceptedButFlagged() {
        OrganizationMembership membership = registrationService.submitRecruiterRegistration(
                new RecruiterData("Lee Huang", "HR manager", "lee" + n + "@gmail.example", null, "Sunrise-2026x"),
                wacoFreight(), null).membership();

        assertEquals(OrganizationRules.DOMAIN_MISMATCH, membership.getReviewFlag());
    }

    @Test
    void anExpiredLinkVerifiesNothingAndANewOneIsSent() {
        RecruiterRegistration registration = register();
        RecruiterRegistrationService tomorrow = new RecruiterRegistrationService(userRepository, recruiterRepository,
                organizationRepository, membershipRepository, notificationService, passwordEncoder,
                Clock.offset(Clock.systemUTC(), Duration.ofHours(25)), "http://localhost:3000", true, false, "");

        VerificationLinkException expired = assertThrows(VerificationLinkException.class,
                () -> tomorrow.verifyRecruiterEmail(token(registration)));
        assertTrue(expired.isExpired());
        assertEquals(MembershipStatus.AWAITING_VERIFICATION, registration.membership().getStatus());

        String newLink = tomorrow.requestNewVerificationLink(token(registration)).orElseThrow();
        tomorrow.verifyRecruiterEmail(newLink.substring(RecruiterRegistrationService.VERIFY_PATH.length()));
        assertEquals(MembershipStatus.PENDING, registration.membership().getStatus());
    }

    @Test
    void aPendingRecruiterWhoLogsInIsToldTheRequestsStatusAndGetsNoSession() {
        RecruiterRegistration registration = register();
        String email = lee().email();

        LogInRefusedException unverified = assertThrows(LogInRefusedException.class,
                () -> logInService.logIn(email, "Sunrise-2026x"));
        assertTrue(unverified.getMessage().startsWith("Confirm your email first"));

        registrationService.verifyRecruiterEmail(token(registration));
        LogInRefusedException pending = assertThrows(LogInRefusedException.class,
                () -> logInService.logIn(email, "Sunrise-2026x"));
        assertTrue(pending.getMessage().startsWith("Your request is under review"));

        approvalService.approveRequest(registration.membership().getMembershipId(), "admin@careerbridge.example");
        assertEquals(email, logInService.logIn(email, "Sunrise-2026x").user().getEmail());
    }

    private boolean queued(Long requestId) {
        return approvalService.openApprovalQueue().stream()
                .anyMatch(request -> request.getMembershipId().equals(requestId));
    }
}
