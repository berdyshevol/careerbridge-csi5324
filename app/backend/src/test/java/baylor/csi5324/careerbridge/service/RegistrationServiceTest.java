package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.User;
import baylor.csi5324.careerbridge.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

// UC-02 Register as Applicant, CO-02.1
@SpringBootTest
class RegistrationServiceTest {

    @Autowired
    private RegistrationService registrationService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtDecoder jwtDecoder;

    private static String freshEmail() {
        return "new-" + System.nanoTime() + "@example.com";
    }

    @Test
    void createsAnActiveApplicantAndLogsThemIn() {
        String email = freshEmail();

        LoggedIn loggedIn = registrationService.register("  Maria   del Carmen Ruiz ", email, "Sunrise-2026x");

        User saved = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        assertInstanceOf(Applicant.class, saved);
        assertEquals("Maria del Carmen", saved.getFirstName());
        assertEquals("Ruiz", saved.getLastName());
        assertEquals(AccountStatus.ACTIVE, saved.getAccountStatus());
        assertNotEquals("Sunrise-2026x", saved.getPasswordHash());
        assertEquals(email, jwtDecoder.decode(loggedIn.token()).getSubject());
        // Only a hash is kept, and it is the new password's (NFR-UC02.1)
        assertTrue(passwordEncoder.matches("Sunrise-2026x", saved.getPasswordHash()));
    }

    @Test
    void reportsEveryInvalidFieldAtOnce() {
        RegistrationRefusedException refused = assertThrows(RegistrationRefusedException.class,
                () -> registrationService.register(" ", "not-an-email", "short1"));

        assertEquals(Map.of(
                "fullName", "Enter your full name.",
                "email", "Enter an email address like name@example.com.",
                "password", RegistrationService.PASSWORD_POLICY), refused.getFieldErrors());
    }

    @Test
    void storesTheEmailInLowerCaseAndSplitsNamesOnAnySpace() {
        String email = "Mixed." + System.nanoTime() + "@Example.com";

        registrationService.register("Pat\u00a0Kim", email, "Sunrise-2026x");

        User saved = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        assertEquals(email.toLowerCase(), saved.getEmail());
        assertEquals("Pat", saved.getFirstName());
        assertEquals("Kim", saved.getLastName());
    }

    @Test
    void refusesTooLongFieldsAsFieldsNotAsADuplicate() {
        RegistrationRefusedException refused = assertThrows(RegistrationRefusedException.class,
                () -> registrationService.register("Pat " + "K".repeat(300), "a".repeat(300) + "@example.com",
                        "Sunrise-2026x" + "\uD83D\uDE00".repeat(20)));

        assertEquals(java.util.Set.of("fullName", "email", "password"), refused.getFieldErrors().keySet());
    }

    @Test
    void needsAFirstAndALastName() {
        RegistrationRefusedException refused = assertThrows(RegistrationRefusedException.class,
                () -> registrationService.register("Cher", freshEmail(), "Sunrise-2026x"));
        assertEquals("Enter your first and last name.", refused.getFieldErrors().get("fullName"));
    }

    @Test
    void appliesThePasswordPolicy() {
        for (String weak : new String[] {"onlyletters!", "1234567890", "Short-1a", ""}) {
            RegistrationRefusedException refused = assertThrows(RegistrationRefusedException.class,
                    () -> registrationService.register("Pat Kim", freshEmail(), weak));
            assertEquals(Map.of("password", RegistrationService.PASSWORD_POLICY), refused.getFieldErrors(), weak);
        }
    }

    @Test
    void refusesAnEmailThatIsAlreadyRegisteredWhateverItsCase() {
        String email = freshEmail();
        registrationService.register("Pat Kim", email, "Sunrise-2026x");

        AlreadyRegisteredException refused = assertThrows(AlreadyRegisteredException.class,
                () -> registrationService.register("Pat Kim", email.toUpperCase(), "Sunrise-2026x"));
        assertEquals("An account already exists for this email address. Log in instead.", refused.getMessage());
        // The sample applicant has an account too, though no password yet
        assertThrows(AlreadyRegisteredException.class,
                () -> registrationService.register("Jordan Lee", ApplicationService.SAMPLE_APPLICANT_EMAIL, "Sunrise-2026x"));
    }
}
