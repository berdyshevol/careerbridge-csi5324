package baylor.csi5324.careerbridge.config;

import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.Administrator;
import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.MembershipRequestType;
import baylor.csi5324.careerbridge.model.MembershipStatus;
import baylor.csi5324.careerbridge.model.OrganizationMembership;
import baylor.csi5324.careerbridge.model.Recruiter;
import baylor.csi5324.careerbridge.model.Role;
import baylor.csi5324.careerbridge.model.User;
import baylor.csi5324.careerbridge.repository.OrganizationMembershipRepository;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import baylor.csi5324.careerbridge.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Supplier;

// One account per role for demonstrations and the end-to-end tests. The passwords come from the
// environment (locally .env), never from the repository; a user whose password is not set is not created.
// Only an in-memory database, which lives and dies on one laptop, gets the well-known local passwords
// below, so that a member without .env can still log in (app/README.md).
@Component
@Order(2) // after SampleDataLoader, which creates Jordan Lee with the sample applications
public class DemoUsers implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoUsers.class);

    record DemoUser(String firstName, String lastName, String email, Supplier<User> kind, String password) {
    }

    // Every demo account of a role shares that role's password, easy to say out loud in a demo (SCRUM-226);
    // on Neon it comes from DEMO_<ROLE>_PASSWORD
    static final String LOCAL_PASSWORD = "Baylor@2026";

    private static String orLocal(String password, String local, boolean inMemory) {
        return password.isBlank() && inMemory ? local : password;
    }

    // The demo recruiter's approved organizations (UC-09 precondition); Lone Star Logistics is left to join
    static final List<String> DEMO_RECRUITER_ORGANIZATIONS = List.of("Brazos Analytics", "Waco Health Partners");
    // The sample recruiters of data/recruiters.csv who belong to one organization only: theirs
    static final Map<String, String> OWN_ORGANIZATION = Map.of(
            "recruiter3@example.com", "Pixel Labs",
            "recruiter4@example.com", "Lone Star Robotics",
            "recruiter5@example.com", "Cloud Nine Software",
            "recruiter6@example.com", "Green Grid Energy");

    private static final List<String> NUMBERS = List.of("One", "Two", "Three", "Four", "Five", "Six");

    private static DemoUser numbered(String role, int n, Supplier<User> kind, String password) {
        return new DemoUser(role, NUMBERS.get(n - 1), role.toLowerCase() + n + "@example.com", kind, password);
    }

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationMembershipRepository membershipRepository;
    private final PasswordEncoder passwordEncoder;
    private final List<DemoUser> demoUsers;

    public DemoUsers(UserRepository userRepository, OrganizationRepository organizationRepository,
                     OrganizationMembershipRepository membershipRepository, PasswordEncoder passwordEncoder,
                     @Value("${careerbridge.demo.applicant-password}") String applicantPassword,
                     @Value("${careerbridge.demo.recruiter-password}") String recruiterPassword,
                     @Value("${careerbridge.demo.administrator-password}") String administratorPassword,
                     @Value("${spring.datasource.url}") String databaseUrl,
                     @Value("${careerbridge.demo.local-passwords}") boolean localPasswordsAllowed) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.membershipRepository = membershipRepository;
        this.passwordEncoder = passwordEncoder;
        // The Docker image switches this off: an image that lost DATABASE_URL must not get known passwords
        boolean inMemory = localPasswordsAllowed && databaseUrl.startsWith("jdbc:h2:mem:");
        String applicant = orLocal(applicantPassword, LOCAL_PASSWORD, inMemory);
        String recruiter = orLocal(recruiterPassword, LOCAL_PASSWORD, inMemory);
        String administrator = orLocal(administratorPassword, LOCAL_PASSWORD, inMemory);
        this.demoUsers = List.of(
                new DemoUser("Jordan", "Lee", SampleDataLoader.SAMPLE_APPLICANT_EMAIL, Applicant::new, applicant),
                new DemoUser("Sam", "Rivera", "sam.rivera@example.com", Applicant::new, applicant),
                new DemoUser("Riley", "Chen", "riley.chen@example.com", Recruiter::new, recruiter),
                new DemoUser("Avery", "Morgan", "admin@careerbridge.example", Administrator::new, administrator),
                numbered("Applicant", 1, Applicant::new, applicant),
                numbered("Applicant", 2, Applicant::new, applicant),
                numbered("Applicant", 3, Applicant::new, applicant),
                numbered("Recruiter", 1, Recruiter::new, recruiter),
                numbered("Recruiter", 2, Recruiter::new, recruiter),
                numbered("Recruiter", 3, Recruiter::new, recruiter),
                numbered("Recruiter", 4, Recruiter::new, recruiter),
                numbered("Recruiter", 5, Recruiter::new, recruiter),
                numbered("Recruiter", 6, Recruiter::new, recruiter));
    }

    @Override
    @Transactional
    public void run(String... args) {
        for (DemoUser demo : demoUsers) {
            if (demo.password().isBlank()) {
                continue;
            }
            User user = userRepository.findByEmailIgnoreCase(demo.email()).orElseGet(() -> create(demo));
            if (Role.of(user) != Role.of(demo.kind().get())) {
                log.warn("Demo user {} exists with another role; left as it is", demo.email());
                continue;
            }
            // A changed password in the environment takes effect on the next start
            if (user.getPasswordHash() == null || !passwordEncoder.matches(demo.password(), user.getPasswordHash())) {
                user.setPasswordHash(passwordEncoder.encode(demo.password()));
            }
            if (user instanceof Recruiter recruiter) {
                giveMemberships(recruiter);
            }
        }
    }

    // Only a recruiter who has none yet: memberships changed through the app are left as they are
    private void giveMemberships(Recruiter recruiter) {
        if (!membershipRepository.findByRecruiterOrderByRequestedAtAscMembershipIdAsc(recruiter).isEmpty()) {
            return;
        }
        String own = OWN_ORGANIZATION.get(recruiter.getEmail().toLowerCase(Locale.ROOT));
        for (String name : own == null ? DEMO_RECRUITER_ORGANIZATIONS : List.of(own)) {
            organizationRepository.findByName(name).ifPresent(organization -> {
                OrganizationMembership membership = new OrganizationMembership(recruiter, organization,
                        MembershipStatus.ACTIVE, MembershipRequestType.NEW_RECRUITER_EXISTING_ORGANIZATION, Instant.now());
                membership.setRole("Recruiter");
                membership.approve("demo data", Instant.now());
                membershipRepository.save(membership);
            });
        }
    }

    private User create(DemoUser demo) {
        User user = demo.kind().get();
        user.setFirstName(demo.firstName());
        user.setLastName(demo.lastName());
        user.setEmail(demo.email());
        user.setAccountStatus(AccountStatus.ACTIVE);
        return userRepository.save(user);
    }
}
