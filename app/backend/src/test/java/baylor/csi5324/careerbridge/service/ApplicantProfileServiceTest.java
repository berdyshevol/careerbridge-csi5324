package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.config.SampleDataLoader;
import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Resume;
import baylor.csi5324.careerbridge.repository.ApplicantRepository;
import baylor.csi5324.careerbridge.repository.ResumeRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
class ApplicantProfileServiceTest {

    private static final String JORDAN = SampleDataLoader.SAMPLE_APPLICANT_EMAIL;
    private static final String PDF = "application/pdf";
    private static final String DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    @Autowired
    private ApplicantProfileService applicantProfileService;

    @Autowired
    private ApplicantRepository applicantRepository;

    @Autowired
    private ResumeRepository resumeRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void showsTheLoggedInApplicantsOwnDetails() {
        Applicant profile = applicantProfileService.viewProfile("Jordan.Lee@Example.com");

        assertEquals("Jordan", profile.getFirstName());
        assertEquals("Lee", profile.getLastName());
        assertEquals(JORDAN, profile.getEmail());
        assertEquals("(254) 555-0142", profile.getPhone());
        assertEquals("Rivera", applicantProfileService.viewProfile("sam.rivera@example.com").getLastName());
    }

    @Test
    void anApplicantWithoutAResumeHasNoneOnFile() {
        assertNull(applicantProfileService.viewProfile("sam.rivera@example.com").getResume());
    }

    @Test
    void showsTheResumeOnFile() {
        Resume resume = new Resume();
        resume.setFileName("Jordan_Lee_CV.pdf");
        resume.setFileType("application/pdf");
        resume.setFileSize(2048L);
        resume.setUploadDate(LocalDateTime.of(2026, 10, 1, 9, 30));
        Applicant jordan = applicantRepository.findByEmailIgnoreCase(JORDAN).orElseThrow();
        jordan.setResume(resumeRepository.save(resume));
        applicantRepository.saveAndFlush(jordan);

        Resume onFile = applicantProfileService.viewProfile(JORDAN).getResume();

        assertEquals("Jordan_Lee_CV.pdf", onFile.getFileName());
        assertEquals(LocalDateTime.of(2026, 10, 1, 9, 30), onFile.getUploadDate());
    }

    @Test
    void anAccountThatNoLongerExistsEndsTheSession() {
        assertThrows(AccountGoneException.class, () -> applicantProfileService.viewProfile("gone@example.com"));
    }

    @Test
    void savesTheNewNameAndPhone() {
        Applicant saved = applicantProfileService.updateProfile("Jordan.Lee@Example.com",
                details("  Jordy ", "Lee-Park", "+1 254 555 0199"));

        assertEquals("Jordy", saved.getFirstName());
        Applicant onFile = applicantRepository.findByEmailIgnoreCase(JORDAN).orElseThrow();
        assertEquals("Jordy", onFile.getFirstName());
        assertEquals("Lee-Park", onFile.getLastName());
        assertEquals("+1 254 555 0199", onFile.getPhone());
        assertEquals(JORDAN, onFile.getEmail());
    }

    @Test
    void savesTheOtherProfileDetails() {
        applicantProfileService.updateProfile(JORDAN, new ProfileDetails("Jordan", "Lee", "(254) 555-0142",
                "Waco, TX", " Data analyst ", "SQL, Python", "B.S. Statistics, Baylor University",
                "Analyst at Brazos Analytics, 2023 to now"));

        Applicant onFile = applicantRepository.findByEmailIgnoreCase(JORDAN).orElseThrow();
        assertEquals("Waco, TX", onFile.getLocation());
        assertEquals("Data analyst", onFile.getHeadline());
        assertEquals("SQL, Python", onFile.getSkills());
        assertEquals("B.S. Statistics, Baylor University", onFile.getEducation());
        assertEquals("Analyst at Brazos Analytics, 2023 to now", onFile.getWorkExperience());

        applicantProfileService.updateProfile(JORDAN, details("Jordan", "Lee", "(254) 555-0142"));
        assertNull(applicantRepository.findByEmailIgnoreCase(JORDAN).orElseThrow().getHeadline());
    }

    @Test
    void refusesADetailLongerThanItsColumn() {
        // The longest text of each kind is accepted: the database column holds it
        applicantProfileService.updateProfile(JORDAN, new ProfileDetails("Jordan", "Lee", null,
                "L".repeat(255), "H".repeat(255), "S".repeat(2000), "E".repeat(4000), "W".repeat(10000)));
        applicantRepository.flush();

        assertRefused(new ProfileDetails("Jordan", "Lee", null,
                "L".repeat(256), "H".repeat(256), "S".repeat(2001), "E".repeat(4001), "W".repeat(10001)), Map.of(
                "location", "Enter at most 255 characters.",
                "headline", "Enter at most 255 characters.",
                "skills", "Enter at most 2000 characters.",
                "education", "Enter at most 4000 characters.",
                "workExperience", "Enter at most 10000 characters."));
    }

    @Test
    void anEmptyPhoneNumberRemovesIt() {
        applicantProfileService.updateProfile(JORDAN, details("Jordan", "Lee", "  "));

        assertNull(applicantRepository.findByEmailIgnoreCase(JORDAN).orElseThrow().getPhone());
    }

    @Test
    void refusesAMissingFirstName() {
        assertRefused(details(" ", "Lee", "(254) 555-0142"),
                Map.of("firstName", "Enter your first name."));
    }

    @Test
    void refusesAMissingLastName() {
        assertRefused(details("Jordan", null, "(254) 555-0142"),
                Map.of("lastName", "Enter your last name."));
    }

    @Test
    void refusesANameLongerThanItsColumn() {
        assertRefused(details("J".repeat(256), "Lee", null),
                Map.of("firstName", "Enter at most 255 characters."));
    }

    @Test
    void refusesAMalformedPhoneNumber() {
        for (String phone : new String[]{"call me", "555-01", "254 555 0142 ext. 9", "+1 (254) 555-0142-1234-56", "1+254 555 0142"}) {
            assertRefused(details("Jordan", "Lee", phone),
                    Map.of("phone", ApplicantProfileService.PHONE_FORMAT));
        }
    }

    @Test
    void refusesEveryInvalidFieldAtOnceAndSavesNothing() {
        assertRefused(details("", "", "abc"), Map.of(
                "firstName", "Enter your first name.",
                "lastName", "Enter your last name.",
                "phone", ApplicantProfileService.PHONE_FORMAT));
    }

    @Test
    void validFieldsAreNotSavedWhenAnotherIsRefused() {
        assertRefused(details("Jordy", "Lee-Park", "abc"),
                Map.of("phone", ApplicantProfileService.PHONE_FORMAT));
    }

    @Test
    void anAccountThatNoLongerExistsCannotBeSaved() {
        assertThrows(AccountGoneException.class, () -> applicantProfileService.updateProfile("gone@example.com",
                details("Jordan", "Lee", null)));
    }

    @Test
    void storesAnUploadedPdfAsTheResumeOnFile() throws Exception {
        MockMultipartFile file = pdf("Jordan_Lee_CV.pdf", 2048);

        Resume uploaded = applicantProfileService.uploadResume("Jordan.Lee@Example.com", file);

        assertNotNull(uploaded.getUploadDate());
        // From the database itself, so the content went through its column
        entityManager.flush();
        entityManager.clear();
        Resume onFile = applicantProfileService.viewProfile(JORDAN).getResume();
        assertEquals("Jordan_Lee_CV.pdf", onFile.getFileName());
        assertEquals(PDF, onFile.getFileType());
        assertEquals(2048L, onFile.getFileSize());
        assertArrayEquals(file.getBytes(), onFile.getContent());
        assertEquals(uploaded.getUploadDate(), onFile.getUploadDate());
    }

    @Test
    void storesAnUploadedDocx() {
        // A browser that does not know the type declares application/octet-stream
        for (String declaredType : new String[]{DOCX, "application/octet-stream"}) {
            applicantProfileService.uploadResume(JORDAN, new MockMultipartFile("file", "Jordan Lee.DOCX",
                    declaredType, startingWith("PK\u0003\u0004", 4096)));

            Resume onFile = applicantProfileService.viewProfile(JORDAN).getResume();
            assertEquals("Jordan Lee.DOCX", onFile.getFileName());
            assertEquals(DOCX, onFile.getFileType());
        }
    }

    @Test
    void acceptsAFileOfExactly5MB() {
        applicantProfileService.uploadResume(JORDAN, pdf("cv.pdf", Resume.MAX_FILE_SIZE));
        entityManager.flush();
        entityManager.clear();

        assertEquals(5L * 1024 * 1024, applicantProfileService.viewProfile(JORDAN).getResume().getFileSize());
    }

    @Test
    void keepsOnlyTheFileNameOfAPath() {
        applicantProfileService.uploadResume(JORDAN, pdf("C:\\Users\\jordan\\cv.pdf", 100));

        assertEquals("cv.pdf", applicantProfileService.viewProfile(JORDAN).getResume().getFileName());
    }

    @Test
    void anUploadReplacesThePreviousResume() {
        Resume first = applicantProfileService.uploadResume(JORDAN, pdf("first.pdf", 100));
        entityManager.flush();

        Resume second = applicantProfileService.uploadResume(JORDAN, pdf("second.pdf", 200));
        entityManager.flush();
        entityManager.clear();

        assertEquals(second.getResumeId(), applicantProfileService.viewProfile(JORDAN).getResume().getResumeId());
        // At most one resume per applicant (BR-6): the replaced one is gone with its content
        assertFalse(resumeRepository.existsById(first.getResumeId()));
    }

    @Test
    void refusesAFileThatIsNotAPdfOrDocx() {
        assertResumeRefused(new MockMultipartFile("file", "notes.txt", "text/plain",
                "Jordan Lee".getBytes(StandardCharsets.UTF_8)), ApplicantProfileService.RESUME_WRONG_TYPE);
        // A renamed file: the name says PDF, the content does not
        assertResumeRefused(new MockMultipartFile("file", "notes.pdf", PDF,
                "Jordan Lee".getBytes(StandardCharsets.UTF_8)), ApplicantProfileService.RESUME_WRONG_TYPE);
        // The content is a PDF, but the browser says it is something else
        assertResumeRefused(new MockMultipartFile("file", "cv.pdf", "text/plain", startingWith("%PDF-1.4", 100)),
                ApplicantProfileService.RESUME_WRONG_TYPE);
        // A DOCX is a zip, but not every zip is a DOCX by name
        assertResumeRefused(new MockMultipartFile("file", "cv.zip", "application/zip", startingWith("PK\u0003\u0004", 100)),
                ApplicantProfileService.RESUME_WRONG_TYPE);
    }

    @Test
    void refusesAFileLargerThan5MB() {
        assertResumeRefused(pdf("cv.pdf", Resume.MAX_FILE_SIZE + 1), ApplicantProfileService.RESUME_TOO_LARGE);
    }

    @Test
    void refusesAnEmptyFile() {
        assertResumeRefused(new MockMultipartFile("file", "cv.pdf", PDF, new byte[0]),
                ApplicantProfileService.RESUME_EMPTY);
    }

    @Test
    void refusesAFileNameLongerThanItsColumn() {
        assertResumeRefused(pdf("c".repeat(252) + ".pdf", 100), ApplicantProfileService.RESUME_NAME_TOO_LONG);
    }

    @Test
    void refusedFilesStateTheAcceptedTypesAndSize() {
        for (String reason : new String[]{ApplicantProfileService.RESUME_WRONG_TYPE,
                ApplicantProfileService.RESUME_TOO_LARGE, ApplicantProfileService.RESUME_EMPTY}) {
            assertTrue(reason.endsWith("Choose a PDF or DOCX file of at most 5 MB."), reason);
        }
    }

    @Test
    void anAccountThatNoLongerExistsCannotUpload() {
        assertThrows(AccountGoneException.class,
                () -> applicantProfileService.uploadResume("gone@example.com", pdf("cv.pdf", 100)));
    }

    private static MockMultipartFile pdf(String fileName, int size) {
        return new MockMultipartFile("file", fileName, PDF, startingWith("%PDF-1.4", size));
    }

    private static byte[] startingWith(String signature, int size) {
        byte[] content = new byte[size];
        Arrays.fill(content, (byte) ' ');
        byte[] start = signature.getBytes(StandardCharsets.ISO_8859_1);
        System.arraycopy(start, 0, content, 0, start.length);
        return content;
    }

    // Extension 6a: the resume on file stays as it was
    private void assertResumeRefused(MockMultipartFile file, String reason) {
        Resume current = applicantProfileService.uploadResume(JORDAN, pdf("current.pdf", 100));
        entityManager.flush();

        ResumeRefusedException refused = assertThrows(ResumeRefusedException.class,
                () -> applicantProfileService.uploadResume(JORDAN, file));

        assertEquals(reason, refused.getMessage());
        entityManager.flush();
        entityManager.clear();
        Resume onFile = applicantProfileService.viewProfile(JORDAN).getResume();
        assertEquals(current.getResumeId(), onFile.getResumeId());
        assertEquals("current.pdf", onFile.getFileName());
    }

    private static ProfileDetails details(String firstName, String lastName, String phone) {
        return new ProfileDetails(firstName, lastName, phone, null, null, null, null, null);
    }

    private void assertRefused(ProfileDetails details, Map<String, String> fieldErrors) {
        Applicant before = applicantRepository.findByEmailIgnoreCase(JORDAN).orElseThrow();
        String location = before.getLocation();
        String workExperience = before.getWorkExperience();

        ProfileRefusedException refused = assertThrows(ProfileRefusedException.class,
                () -> applicantProfileService.updateProfile(JORDAN, details));

        assertEquals(fieldErrors, refused.getFieldErrors());
        Applicant onFile = applicantRepository.findByEmailIgnoreCase(JORDAN).orElseThrow();
        assertEquals("Jordan", onFile.getFirstName());
        assertEquals("Lee", onFile.getLastName());
        assertEquals(location, onFile.getLocation());
        assertEquals(workExperience, onFile.getWorkExperience());
    }
}
