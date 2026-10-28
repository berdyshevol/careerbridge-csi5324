package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Resume;
import baylor.csi5324.careerbridge.repository.ApplicantRepository;
import baylor.csi5324.careerbridge.repository.ResumeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Locale;
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

    // UC-03 extension 6a: every refusal states the accepted types and the size limit
    private static final String ACCEPTED = " Choose a PDF or DOCX file of at most 5 MB.";
    public static final String RESUME_TOO_LARGE = "The file is larger than 5 MB." + ACCEPTED;
    static final String RESUME_EMPTY = "The file is empty." + ACCEPTED;
    static final String RESUME_WRONG_TYPE = "The file is not a PDF or DOCX." + ACCEPTED;
    static final String RESUME_NAME_TOO_LONG = "The file name is longer than " + MAX_LINE_LENGTH
            + " characters. Rename the file and upload it again.";

    // The name, the type the browser declares and the first bytes must agree, so a renamed file is
    // refused. A browser that does not know the type declares application/octet-stream, or nothing.
    private enum ResumeFormat {
        PDF(".pdf", "application/pdf", "%PDF"),
        DOCX(".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "PK\u0003\u0004");

        final String extension;
        final String contentType;
        final byte[] signature;

        ResumeFormat(String extension, String contentType, String signature) {
            this.extension = extension;
            this.contentType = contentType;
            this.signature = signature.getBytes(StandardCharsets.ISO_8859_1);
        }

        boolean matches(String fileName, String declaredType, byte[] content) {
            return fileName.toLowerCase(Locale.ROOT).endsWith(extension)
                    && (declaredType == null || declaredType.isBlank()
                        || declaredType.equals("application/octet-stream") || declaredType.equals(contentType))
                    && content.length >= signature.length
                    && Arrays.equals(content, 0, signature.length, signature, 0, signature.length);
        }
    }

    private final ApplicantRepository applicantRepository;
    private final ResumeRepository resumeRepository;
    private final Clock clock;

    public ApplicantProfileService(ApplicantRepository applicantRepository, ResumeRepository resumeRepository,
                                   Clock clock) {
        this.applicantRepository = applicantRepository;
        this.resumeRepository = resumeRepository;
        this.clock = clock;
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

    // CO-03.3: the accepted file replaces the resume on file (BR-6); a refused one changes nothing (6a)
    public Resume uploadResume(String email, MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResumeRefusedException(RESUME_EMPTY);
        }
        if (file.getSize() > Resume.MAX_FILE_SIZE) {
            throw new ResumeRefusedException(RESUME_TOO_LARGE);
        }
        // Some browsers send the whole path; only the name is the applicant's
        String fileName = stripped(file.getOriginalFilename()).replaceAll(".*[/\\\\]", "");
        if (fileName.length() > MAX_LINE_LENGTH) {
            throw new ResumeRefusedException(RESUME_NAME_TOO_LONG);
        }
        byte[] content;
        try {
            content = file.getBytes();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        ResumeFormat format = Arrays.stream(ResumeFormat.values())
                .filter(candidate -> candidate.matches(fileName, file.getContentType(), content))
                .findFirst()
                .orElseThrow(() -> new ResumeRefusedException(RESUME_WRONG_TYPE));

        Applicant applicant = viewProfile(email);
        Resume previous = applicant.getResume();
        // In UTC, the clock's zone; the screen shows the day where the applicant is
        Resume resume = resumeRepository.save(new Resume(fileName, format.contentType, content.length, content,
                LocalDateTime.now(clock)));
        applicant.setResume(resume);
        applicantRepository.save(applicant);
        // Submitted applications keep their own copy (ResumeSnapshot, A6), so nothing else refers to it
        if (previous != null) {
            resumeRepository.delete(previous);
        }
        return resume;
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
