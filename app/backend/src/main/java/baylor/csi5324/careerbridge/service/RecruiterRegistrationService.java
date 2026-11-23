package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.MembershipRequestType;
import baylor.csi5324.careerbridge.model.MembershipStatus;
import baylor.csi5324.careerbridge.model.NotificationType;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.OrganizationMembership;
import baylor.csi5324.careerbridge.model.Recruiter;
import baylor.csi5324.careerbridge.repository.OrganizationMembershipRepository;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import baylor.csi5324.careerbridge.repository.RecruiterRepository;
import baylor.csi5324.careerbridge.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

// UC-08 Register Recruiter and Organization, CO-08.1 and CO-08.2
@Service
@Transactional
public class RecruiterRegistrationService {

    private static final Duration VERIFICATION_LINK_LIFETIME = Duration.ofHours(24);
    static final String VERIFY_PATH = "/recruiter/verify?token=";
    private static final int MAX_PHONE_LENGTH = 31;

    private final UserRepository userRepository;
    private final RecruiterRepository recruiterRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationMembershipRepository membershipRepository;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;
    private final String frontendOrigin;
    private final boolean showVerificationLinks;
    private final SecureRandom random = new SecureRandom();

    public RecruiterRegistrationService(UserRepository userRepository, RecruiterRepository recruiterRepository,
                                        OrganizationRepository organizationRepository,
                                        OrganizationMembershipRepository membershipRepository,
                                        NotificationService notificationService, PasswordEncoder passwordEncoder,
                                        Clock clock,
                                        @Value("${careerbridge.frontend-origins}") String frontendOrigins,
                                        @Value("${careerbridge.demo.verification-links}") boolean verificationLinks,
                                        @Value("${careerbridge.demo.local-passwords}") boolean localDemo,
                                        @Value("${spring.datasource.url}") String databaseUrl) {
        this.userRepository = userRepository;
        this.recruiterRepository = recruiterRepository;
        this.organizationRepository = organizationRepository;
        this.membershipRepository = membershipRepository;
        this.notificationService = notificationService;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
        this.frontendOrigin = frontendOrigins.split(",")[0].strip();
        // As for the demo passwords (DemoUsers): an in-memory database lives on one laptop, which has no mail
        this.showVerificationLinks = verificationLinks || localDemo && databaseUrl.startsWith("jdbc:h2:mem:");
    }

    // CO-08.1. joinOrganizationId is set once the visitor accepted to join a registered organization (4c)
    public RecruiterRegistration submitRecruiterRegistration(RecruiterData recruiterData,
                                                             OrganizationData organizationData,
                                                             Long joinOrganizationId) {
        RecruiterData given = recruiterData == null ? new RecruiterData(null, null, null, null, null) : recruiterData;
        String name = AccountRules.name(given.fullName());
        String email = AccountRules.email(given.email());
        Map<String, String> errors = new LinkedHashMap<>();
        AccountRules.checkFullName(name, errors);
        String jobTitle = AccountRules.required(given.jobTitle(), "jobTitle", "Job title",
                AccountRules.MAX_FIELD_LENGTH, errors);
        AccountRules.checkEmail(email, errors);
        String phone = AccountRules.limited(given.phone(), "phone", "Phone", MAX_PHONE_LENGTH, errors);
        AccountRules.checkPassword(given.password(), errors);

        Organization organization;
        if (joinOrganizationId == null) {
            organization = OrganizationRules.newOrganization(organizationData, errors);
        } else {
            organization = organizationRepository.findById(joinOrganizationId)
                    .filter(Organization::isRegistered)
                    .orElse(null);
            if (organization == null) {
                errors.put("organization.name", "That organization is not registered.");
            }
        }
        if (!errors.isEmpty()) {
            throw new RegistrationRefusedException(errors);
        }

        userRepository.findByEmailIgnoreCase(email).ifPresent(existing -> {
            // 4b: an approved recruiter adds an organization through UC-09 instead
            if (existing instanceof Recruiter && existing.getAccountStatus() == AccountStatus.ACTIVE) {
                throw new AlreadyRegisteredException(
                        "An account already exists for this email. Log in and join an additional organization.");
            }
            throw new AlreadyRegisteredException();
        });

        boolean newOrganization = joinOrganizationId == null;
        if (newOrganization) {
            OrganizationRules.rejectDuplicate(organization, organizationRepository);
        }

        Recruiter recruiter = new Recruiter();
        recruiter.setFirstName(AccountRules.firstName(name));
        recruiter.setLastName(AccountRules.lastName(name));
        recruiter.setEmail(email);
        recruiter.setPhone(phone);
        recruiter.setJobTitle(jobTitle);
        recruiter.setAccountStatus(AccountStatus.PENDING_APPROVAL);
        recruiter.setEmailVerified(false);
        recruiter.setPasswordHash(passwordEncoder.encode(given.password()));
        String token = startVerification(recruiter);
        try {
            recruiter = recruiterRepository.saveAndFlush(recruiter);
        } catch (DataIntegrityViolationException sameMomentDuplicate) {
            // Two registrations for one address at once, and the other passed the check above first
            throw new AlreadyRegisteredException();
        }
        if (newOrganization) {
            organization = organizationRepository.save(organization);
        }

        OrganizationMembership membership = new OrganizationMembership(recruiter, organization,
                MembershipStatus.AWAITING_VERIFICATION,
                newOrganization ? MembershipRequestType.NEW_RECRUITER_NEW_ORGANIZATION
                        : MembershipRequestType.NEW_RECRUITER_EXISTING_ORGANIZATION,
                clock.instant());
        membership.setReviewFlag(OrganizationRules.reviewFlag(email, organization));
        membership = membershipRepository.save(membership);

        sendVerificationEmail(recruiter, token);
        return new RecruiterRegistration(membership, shown(token));
    }

    // CO-08.2
    public Recruiter verifyRecruiterEmail(String token) {
        Recruiter recruiter = recruiterWithToken(token);
        if (!clock.instant().isBefore(recruiter.getVerificationExpiresAt())) {
            throw new VerificationLinkException(true);
        }
        recruiter.markEmailVerified();
        for (OrganizationMembership membership
                : membershipRepository.findByRecruiterAndStatus(recruiter, MembershipStatus.AWAITING_VERIFICATION)) {
            // Only now is the request in the Administrator's queue
            membership.setStatus(MembershipStatus.PENDING);
            notificationService.notifyAdministrators(NotificationType.NEW_RECRUITER_REQUEST,
                    "New recruiter request: " + fullName(recruiter) + " for " + membership.getOrganization().getName() + ".");
        }
        return recruiter;
    }

    // Extension 6a: the expired link identifies the recruiter, so the visitor need not type anything
    public Optional<String> requestNewVerificationLink(String expiredToken) {
        Recruiter recruiter = recruiterWithToken(expiredToken);
        String token = startVerification(recruiter);
        sendVerificationEmail(recruiter, token);
        return Optional.ofNullable(shown(token));
    }

    private Recruiter recruiterWithToken(String token) {
        if (token == null || token.isBlank()) {
            throw new VerificationLinkException(false);
        }
        return recruiterRepository.findByVerificationTokenHash(hash(token.strip()))
                .orElseThrow(() -> new VerificationLinkException(false));
    }

    private String startVerification(Recruiter recruiter) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        recruiter.startVerification(hash(token), clock.instant().plus(VERIFICATION_LINK_LIFETIME));
        return token;
    }

    private void sendVerificationEmail(Recruiter recruiter, String token) {
        notificationService.notify(recruiter, NotificationType.EMAIL_VERIFICATION,
                "Open " + frontendOrigin + VERIFY_PATH + token + " within 24 hours to send your request to the administrator.");
    }

    private String shown(String token) {
        return showVerificationLinks ? VERIFY_PATH + token : null;
    }

    static String fullName(Recruiter recruiter) {
        return recruiter.getFirstName() + " " + recruiter.getLastName();
    }

    private static String hash(String token) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
