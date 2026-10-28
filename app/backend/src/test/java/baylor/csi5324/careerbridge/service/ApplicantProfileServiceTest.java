package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.config.SampleDataLoader;
import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Resume;
import baylor.csi5324.careerbridge.repository.ApplicantRepository;
import baylor.csi5324.careerbridge.repository.ResumeRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@Transactional
class ApplicantProfileServiceTest {

    private static final String JORDAN = SampleDataLoader.SAMPLE_APPLICANT_EMAIL;

    @Autowired
    private ApplicantProfileService applicantProfileService;

    @Autowired
    private ApplicantRepository applicantRepository;

    @Autowired
    private ResumeRepository resumeRepository;

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
