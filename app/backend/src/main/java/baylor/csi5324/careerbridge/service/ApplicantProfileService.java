package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.repository.ApplicantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;

import static baylor.csi5324.careerbridge.model.Applicant.MAX_EDUCATION_LENGTH;
import static baylor.csi5324.careerbridge.model.Applicant.MAX_LINE_LENGTH;
import static baylor.csi5324.careerbridge.model.Applicant.MAX_SKILLS_LENGTH;
import static baylor.csi5324.careerbridge.model.Applicant.MAX_WORK_EXPERIENCE_LENGTH;

// UC-03, SD-9 and SD-10: the email is the token's subject, so an applicant only reaches their own profile (BR-15)
@Service
@Transactional
public class ApplicantProfileService {

    // Digits with the usual separators and an optional leading +; 7 to 15 digits reach from a local
    // number to the longest international one (E.164)
    private static final Pattern PHONE = Pattern.compile("^\\+?[0-9 ().-]{7,30}$");
    private static final int PHONE_MIN_DIGITS = 7;
    private static final int PHONE_MAX_DIGITS = 15;
    static final String PHONE_FORMAT = "Enter a phone number like (254) 555-0142.";

    private final ApplicantRepository applicantRepository;

    public ApplicantProfileService(ApplicantRepository applicantRepository) {
        this.applicantRepository = applicantRepository;
    }

    @Transactional(readOnly = true)
    public Applicant viewProfile(String email) {
        return applicantRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new AccountGoneException(email));
    }

    // CO-03.2: every detail changes, or none does (extension 4a)
    public Applicant updateProfile(String email, ProfileDetails details) {
        String firstName = stripped(details.firstName());
        String lastName = stripped(details.lastName());
        String phone = stripped(details.phone());
        String location = stripped(details.location());
        String headline = stripped(details.headline());
        String skills = stripped(details.skills());
        String education = stripped(details.education());
        String workExperience = stripped(details.workExperience());
        Map<String, String> errors = new LinkedHashMap<>();
        if (firstName.isEmpty()) {
            errors.put("firstName", "Enter your first name.");
        }
        if (lastName.isEmpty()) {
            errors.put("lastName", "Enter your last name.");
        }
        // Registration does not ask for a phone number, so an applicant may still have none
        if (!phone.isEmpty() && !wellFormedPhone(phone)) {
            errors.put("phone", PHONE_FORMAT);
        }
        checkLength(errors, "firstName", firstName, MAX_LINE_LENGTH);
        checkLength(errors, "lastName", lastName, MAX_LINE_LENGTH);
        checkLength(errors, "location", location, MAX_LINE_LENGTH);
        checkLength(errors, "headline", headline, MAX_LINE_LENGTH);
        checkLength(errors, "skills", skills, MAX_SKILLS_LENGTH);
        checkLength(errors, "education", education, MAX_EDUCATION_LENGTH);
        checkLength(errors, "workExperience", workExperience, MAX_WORK_EXPERIENCE_LENGTH);
        if (!errors.isEmpty()) {
            throw new ProfileRefusedException(errors);
        }

        Applicant applicant = viewProfile(email);
        applicant.setFirstName(firstName);
        applicant.setLastName(lastName);
        applicant.setPhone(nullIfEmpty(phone));
        applicant.setLocation(nullIfEmpty(location));
        applicant.setHeadline(nullIfEmpty(headline));
        applicant.setSkills(nullIfEmpty(skills));
        applicant.setEducation(nullIfEmpty(education));
        applicant.setWorkExperience(nullIfEmpty(workExperience));
        return applicantRepository.save(applicant);
    }

    private static String stripped(String value) {
        return value == null ? "" : value.strip();
    }

    private static String nullIfEmpty(String value) {
        return value.isEmpty() ? null : value;
    }

    private static void checkLength(Map<String, String> errors, String field, String value, int maxLength) {
        if (value.length() > maxLength) {
            errors.putIfAbsent(field, "Enter at most " + maxLength + " characters.");
        }
    }

    private static boolean wellFormedPhone(String phone) {
        long digits = phone.chars().filter(Character::isDigit).count();
        return PHONE.matcher(phone).matches() && digits >= PHONE_MIN_DIGITS && digits <= PHONE_MAX_DIGITS;
    }
}
