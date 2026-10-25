package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

// UC-02 Register as Applicant, CO-02.1. No verification email (A15): Iteration 1 feedback asks for no
// external services, so the applicant account is Active at once and the new Applicant is logged in.
@Service
@Transactional
public class RegistrationService {

    // Enough to catch a typo; whether the address exists is not something a form can know
    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    // Any Unicode space, so a no-break space pasted between two names still separates them
    private static final Pattern SPACES = Pattern.compile("\\s+", Pattern.UNICODE_CHARACTER_CLASS);
    private static final int MAX_FIELD_LENGTH = 255; // the column length
    // A15
    private static final int PASSWORD_MIN_LENGTH = 10;
    // BCrypt reads no further, and Spring Security refuses a longer password outright
    private static final int PASSWORD_MAX_BYTES = 72;
    static final String PASSWORD_POLICY = "The password needs at least " + PASSWORD_MIN_LENGTH
            + " characters, including a letter and a number.";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final LogInService logInService;

    public RegistrationService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                               LogInService logInService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.logInService = logInService;
    }

    public LoggedIn register(String fullName, String email, String password) {
        String name = fullName == null ? "" : SPACES.matcher(fullName).replaceAll(" ").strip();
        // One account per address whatever its case (A5 of Log In): stored the way log-in looks it up
        String address = email == null ? "" : email.strip().toLowerCase(Locale.ROOT);
        Map<String, String> errors = new LinkedHashMap<>();
        int lastSpace = name.lastIndexOf(' ');
        if (name.isEmpty()) {
            errors.put("fullName", "Enter your full name.");
        } else if (lastSpace < 0) {
            // The domain model keeps First Name and Last Name apart (CO-02.1)
            errors.put("fullName", "Enter your first and last name.");
        } else if (name.length() > MAX_FIELD_LENGTH) {
            errors.put("fullName", "Enter a name of at most " + MAX_FIELD_LENGTH + " characters.");
        }
        if (address.isEmpty()) {
            errors.put("email", "Enter your email address.");
        } else if (address.length() > MAX_FIELD_LENGTH || !EMAIL.matcher(address).matches()) {
            errors.put("email", "Enter an email address like name@example.com.");
        }
        if (password == null || password.codePointCount(0, password.length()) < PASSWORD_MIN_LENGTH
                || password.codePoints().noneMatch(Character::isLetter)
                || password.codePoints().noneMatch(Character::isDigit)) {
            errors.put("password", PASSWORD_POLICY);
        } else if (password.getBytes(StandardCharsets.UTF_8).length > PASSWORD_MAX_BYTES) {
            errors.put("password", "The password is too long: use at most 72 characters without accents or emoji.");
        }
        if (!errors.isEmpty()) {
            throw new RegistrationRefusedException(errors);
        }
        if (userRepository.findByEmailIgnoreCase(address).isPresent()) {
            throw new AlreadyRegisteredException();
        }

        Applicant applicant = new Applicant();
        applicant.setFirstName(name.substring(0, lastSpace));
        applicant.setLastName(name.substring(lastSpace + 1));
        applicant.setEmail(address);
        applicant.setAccountStatus(AccountStatus.ACTIVE);
        applicant.setPasswordHash(passwordEncoder.encode(password));
        try {
            return logInService.startSession(userRepository.saveAndFlush(applicant));
        } catch (DataIntegrityViolationException sameMomentDuplicate) {
            // Only the unique email can fail here, the lengths are checked above: two registrations
            // for one address at once, and the other passed the check above first
            throw new AlreadyRegisteredException();
        }
    }
}
