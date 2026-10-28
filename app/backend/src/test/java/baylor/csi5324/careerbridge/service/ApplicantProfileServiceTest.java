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
}
