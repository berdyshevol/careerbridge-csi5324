package baylor.csi5324.careerbridge.config;

import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.Administrator;
import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Recruiter;
import baylor.csi5324.careerbridge.model.Role;
import baylor.csi5324.careerbridge.model.User;
import baylor.csi5324.careerbridge.repository.UserRepository;
import baylor.csi5324.careerbridge.service.ApplicationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
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

    private static String orLocal(String password, String local, boolean inMemory) {
        return password.isBlank() && inMemory ? local : password;
    }

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final List<DemoUser> demoUsers;

    public DemoUsers(UserRepository userRepository, PasswordEncoder passwordEncoder,
                     @Value("${careerbridge.demo.applicant-password}") String applicantPassword,
                     @Value("${careerbridge.demo.second-applicant-password}") String secondApplicantPassword,
                     @Value("${careerbridge.demo.recruiter-password}") String recruiterPassword,
                     @Value("${careerbridge.demo.administrator-password}") String administratorPassword,
                     @Value("${spring.datasource.url}") String databaseUrl) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        boolean inMemory = databaseUrl.startsWith("jdbc:h2:mem:");
        this.demoUsers = List.of(
                new DemoUser("Jordan", "Lee", ApplicationService.SAMPLE_APPLICANT_EMAIL,
                        Applicant::new, orLocal(applicantPassword, "Applicant-local-1", inMemory)),
                new DemoUser("Sam", "Rivera", "sam.rivera@example.com", Applicant::new,
                        orLocal(secondApplicantPassword, "Applicant-local-2", inMemory)),
                new DemoUser("Riley", "Chen", "riley.chen@example.com", Recruiter::new,
                        orLocal(recruiterPassword, "Recruiter-local-1", inMemory)),
                new DemoUser("Avery", "Morgan", "admin@careerbridge.example", Administrator::new,
                        orLocal(administratorPassword, "Administrator-local-1", inMemory)));
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
