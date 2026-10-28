package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Resume;
import baylor.csi5324.careerbridge.service.ApplicantProfileService;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ApplicantProfileControllerTest {

    private final ApplicantProfileService applicantProfileService = mock(ApplicantProfileService.class);
    private final MockMvc mockMvc = MockMvcBuilders
            .standaloneSetup(new ApplicantProfileController(applicantProfileService)).build();

    private static Applicant jordan() {
        Applicant applicant = new Applicant();
        applicant.setFirstName("Jordan");
        applicant.setLastName("Lee");
        applicant.setEmail("jordan.lee@example.com");
        applicant.setPhone("(254) 555-0142");
        return applicant;
    }

    @Test
    void answersWithTheDetailsAndTheResumeOnFile() throws Exception {
        Applicant applicant = jordan();
        Resume resume = new Resume();
        resume.setFileName("Jordan_Lee_CV.pdf");
        resume.setFileType("application/pdf");
        resume.setFileSize(2048L);
        resume.setUploadDate(LocalDateTime.of(2026, 10, 1, 9, 30));
        applicant.setResume(resume);
        when(applicantProfileService.viewProfile("jordan.lee@example.com")).thenReturn(applicant);

        mockMvc.perform(get("/api/applicant/profile").principal(() -> "jordan.lee@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Jordan"))
                .andExpect(jsonPath("$.lastName").value("Lee"))
                .andExpect(jsonPath("$.email").value("jordan.lee@example.com"))
                .andExpect(jsonPath("$.phone").value("(254) 555-0142"))
                .andExpect(jsonPath("$.resume.fileName").value("Jordan_Lee_CV.pdf"))
                .andExpect(jsonPath("$.resume.uploadDate").value("2026-10-01T09:30:00"))
                // Only the name and date of CO-03.1; the file's type and size stay in the backend
                .andExpect(jsonPath("$.resume.fileSize").doesNotExist());
    }

    @Test
    void answersWithNoResumeWhenNoneIsOnFile() throws Exception {
        when(applicantProfileService.viewProfile("jordan.lee@example.com")).thenReturn(jordan());

        mockMvc.perform(get("/api/applicant/profile").principal(() -> "jordan.lee@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Jordan"))
                .andExpect(jsonPath("$.resume").isEmpty());
    }
}
