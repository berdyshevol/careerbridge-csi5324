package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.config.SampleDataLoader;
import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Role;
import baylor.csi5324.careerbridge.model.User;
import baylor.csi5324.careerbridge.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class LogInServiceTest {

    private static final String PASSWORD = "Correct-horse-9";

    @Autowired
    private LogInService logInService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtDecoder jwtDecoder;

    private String email;

    @BeforeEach
    void anActiveApplicant() {
        email = "applicant-" + System.nanoTime() + "@example.com";
        Applicant applicant = new Applicant();
        applicant.setFirstName("Pat");
        applicant.setLastName("Kim");
        applicant.setEmail(email);
        applicant.setAccountStatus(AccountStatus.ACTIVE);
        applicant.setPasswordHash(passwordEncoder.encode(PASSWORD));
        userRepository.save(applicant);
    }

    @Test
    void theRightPasswordGivesATokenWithTheRole() {
        LoggedIn loggedIn = logInService.logIn(email.toUpperCase(), PASSWORD);

        Jwt token = jwtDecoder.decode(loggedIn.token());
        assertEquals(email, token.getSubject());
        assertEquals(Role.APPLICANT.name(), token.getClaimAsString(LogInService.ROLE_CLAIM));
        assertTrue(token.getExpiresAt().isAfter(token.getIssuedAt()));
    }

    @Test
    void anUnknownEmailAndAWrongPasswordGetTheSameAnswer() {
        LogInRefusedException unknown = assertThrows(LogInRefusedException.class,
                () -> logInService.logIn("nobody@example.com", PASSWORD));
        LogInRefusedException wrong = assertThrows(LogInRefusedException.class,
                () -> logInService.logIn(email, "Wrong-password-1"));

        assertEquals(LogInService.WRONG_CREDENTIALS, unknown.getMessage());
        assertEquals(unknown.getMessage(), wrong.getMessage());
    }

    @Test
    void fiveWrongPasswordsLockTheAccountEvenForTheRightOne() {
        for (int i = 0; i < 4; i++) {
            assertThrows(LogInRefusedException.class, () -> logInService.logIn(email, "Wrong-password-1"));
        }
        LogInRefusedException fifth = assertThrows(LogInRefusedException.class,
                () -> logInService.logIn(email, "Wrong-password-1"));
        assertTrue(fifth.getMessage().endsWith("try again in 15 minutes."), fifth.getMessage());

        LogInRefusedException right = assertThrows(LogInRefusedException.class,
                () -> logInService.logIn(email, PASSWORD));
        assertTrue(right.getMessage().contains("try again in 15 minutes"), right.getMessage());
    }

    @Test
    void anAccountThatIsNotActiveCannotLogIn() {
        User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        user.setAccountStatus(AccountStatus.PENDING_VERIFICATION);
        userRepository.save(user);

        assertThrows(LogInRefusedException.class, () -> logInService.logIn(email, PASSWORD));
    }

    @Test
    void theDemoUsersFromTheEnvironmentCanLogIn() {
        assertEquals(Role.APPLICANT, Role.of(logInService.logIn(
                SampleDataLoader.SAMPLE_APPLICANT_EMAIL, "Applicant-test-1").user()));
        assertEquals(Role.APPLICANT, Role.of(logInService.logIn("sam.rivera@example.com", "Applicant-test-2").user()));
        assertEquals(Role.RECRUITER, Role.of(logInService.logIn("riley.chen@example.com", "Recruiter-test-1").user()));
        assertEquals(Role.ADMINISTRATOR, Role.of(logInService.logIn(
                "admin@careerbridge.example", "Administrator-test-1").user()));
        assertFalse(userRepository.findByEmailIgnoreCase("riley.chen@example.com").orElseThrow()
                .getPasswordHash().contains("Recruiter-test-1"));
    }
}
