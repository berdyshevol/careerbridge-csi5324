package baylor.csi5324.careerbridge.service;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

// The checks every self-registration shares: UC-02 for an applicant, UC-08 for a recruiter
final class AccountRules {

    // Enough to catch a typo; whether the address exists is not something a form can know
    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    // Any Unicode space, so a no-break space pasted between two names still separates them
    private static final Pattern SPACES = Pattern.compile("\\s+", Pattern.UNICODE_CHARACTER_CLASS);
    static final int MAX_FIELD_LENGTH = 255; // the column length
    // A15
    private static final int PASSWORD_MIN_LENGTH = 10;
    // BCrypt reads no further, and Spring Security refuses a longer password outright
    private static final int PASSWORD_MAX_BYTES = 72;
    static final String PASSWORD_POLICY = "The password needs at least " + PASSWORD_MIN_LENGTH
            + " characters, including a letter and a number.";

    private AccountRules() {
    }

    static String name(String fullName) {
        return fullName == null ? "" : SPACES.matcher(fullName).replaceAll(" ").strip();
    }

    // One account per address whatever its case (A5 of Log In): stored the way log-in looks it up
    static String email(String email) {
        return email == null ? "" : email.strip().toLowerCase(Locale.ROOT);
    }

    static String firstName(String name) {
        return name.substring(0, name.lastIndexOf(' '));
    }

    static String lastName(String name) {
        return name.substring(name.lastIndexOf(' ') + 1);
    }

    static void checkFullName(String name, Map<String, String> errors) {
        if (name.isEmpty()) {
            errors.put("fullName", "Enter your full name.");
        } else if (name.lastIndexOf(' ') < 0) {
            // The domain model keeps First Name and Last Name apart (CO-02.1)
            errors.put("fullName", "Enter your first and last name.");
        } else if (name.length() > MAX_FIELD_LENGTH) {
            errors.put("fullName", "Enter a name of at most " + MAX_FIELD_LENGTH + " characters.");
        }
    }

    static void checkEmail(String address, Map<String, String> errors) {
        if (address.isEmpty()) {
            errors.put("email", "Enter your email address.");
        } else if (address.length() > MAX_FIELD_LENGTH || !EMAIL.matcher(address).matches()) {
            errors.put("email", "Enter an email address like name@example.com.");
        }
    }

    static void checkPassword(String password, Map<String, String> errors) {
        if (password == null || password.codePointCount(0, password.length()) < PASSWORD_MIN_LENGTH
                || password.codePoints().noneMatch(Character::isLetter)
                || password.codePoints().noneMatch(Character::isDigit)) {
            errors.put("password", PASSWORD_POLICY);
        } else if (password.getBytes(StandardCharsets.UTF_8).length > PASSWORD_MAX_BYTES) {
            errors.put("password", "The password is too long: use at most 72 characters without accents or emoji.");
        }
    }

    // A blank optional field is kept as no value, not as spaces
    static String optional(String text) {
        return text == null || text.isBlank() ? null : text.strip();
    }

    static String required(String text, String field, String label, int maxLength, Map<String, String> errors) {
        String value = optional(text);
        if (value == null) {
            errors.put(field, label + " is required.");
        } else if (value.length() > maxLength) {
            errors.put(field, label + " must be at most " + maxLength + " characters.");
        }
        return value;
    }

    static String limited(String text, String field, String label, int maxLength, Map<String, String> errors) {
        String value = optional(text);
        if (value != null && value.length() > maxLength) {
            errors.put(field, label + " must be at most " + maxLength + " characters.");
        }
        return value;
    }
}
