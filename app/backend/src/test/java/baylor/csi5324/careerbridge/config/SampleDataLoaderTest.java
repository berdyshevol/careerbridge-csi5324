package baylor.csi5324.careerbridge.config;

import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Resume;
import baylor.csi5324.careerbridge.repository.ApplicantRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
class SampleDataLoaderTest {

    @Autowired
    private SampleDataLoader sampleDataLoader;

    @Autowired
    private ApplicantRepository applicantRepository;

    @Test
    void theDemoApplicantStartsWithAPdfResumeOnFile() {
        Resume resume = jordan().getResume();

        assertEquals("Jordan_Lee_Resume.pdf", resume.getFileName());
        assertEquals("application/pdf", resume.getFileType());
        assertEquals(resume.getContent().length, resume.getFileSize());
        assertTrue(new String(resume.getContent(), StandardCharsets.ISO_8859_1).startsWith("%PDF"));
    }

    @Test
    void aDatabaseLoadedBeforeResumesExistedGivesTheDemoApplicantOne() throws Exception {
        Applicant jordan = jordan();
        jordan.setResume(null);
        applicantRepository.saveAndFlush(jordan);

        sampleDataLoader.run();

        assertEquals("Jordan_Lee_Resume.pdf", jordan().getResume().getFileName());
    }

    private Applicant jordan() {
        return applicantRepository.findByEmailIgnoreCase(SampleDataLoader.SAMPLE_APPLICANT_EMAIL).orElseThrow();
    }
}
