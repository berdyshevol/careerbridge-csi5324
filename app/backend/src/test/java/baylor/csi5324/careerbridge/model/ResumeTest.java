
package baylor.csi5324.careerbridge.model;

import baylor.csi5324.careerbridge.repository.ResumeRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class ResumeTest {

    @Autowired
    private ResumeRepository resumeRepository;

    @Test
    void shouldSaveAndFindResume() {
        Resume resume = new Resume();
        resume.setFileName("sample-resume.pdf");
        resume.setFileType("application/pdf");
        resume.setFileSize(1024L);
        resume.setUploadDate(LocalDateTime.now());

        Resume saved = resumeRepository.save(resume);

        assertNotNull(saved.getResumeId());

        Resume found = resumeRepository
                .findById(saved.getResumeId())
                .orElseThrow();

        assertEquals("sample-resume.pdf", found.getFileName());
        assertEquals("application/pdf", found.getFileType());
        assertEquals(1024L, found.getFileSize());
        assertNotNull(found.getUploadDate());
    }
}
