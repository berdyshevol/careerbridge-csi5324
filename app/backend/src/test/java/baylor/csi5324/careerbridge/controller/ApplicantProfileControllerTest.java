package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Resume;
import baylor.csi5324.careerbridge.service.ApplicantProfileService;
import baylor.csi5324.careerbridge.service.ProfileDetails;
import baylor.csi5324.careerbridge.service.ProfileRefusedException;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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

    @Test
    void savesTheDetailsOfTheLoggedInApplicant() throws Exception {
        Applicant saved = jordan();
        saved.setPhone("+1 254 555 0199");
        saved.setHeadline("Data analyst");
        when(applicantProfileService.updateProfile("jordan.lee@example.com",
                new ProfileDetails("Jordan", "Lee", "+1 254 555 0199", null, "Data analyst", null, null, null))).thenReturn(saved);

        mockMvc.perform(put("/api/applicant/profile").principal(() -> "jordan.lee@example.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"firstName\": \"Jordan\", \"lastName\": \"Lee\", \"phone\": \"+1 254 555 0199\", \"headline\": \"Data analyst\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phone").value("+1 254 555 0199"))
                .andExpect(jsonPath("$.headline").value("Data analyst"))
                .andExpect(jsonPath("$.email").value("jordan.lee@example.com"));
    }

    @Test
    void answersEveryRefusedFieldWithItsReason() throws Exception {
        when(applicantProfileService.updateProfile(any(), any())).thenThrow(new ProfileRefusedException(
                Map.of("firstName", "Enter your first name.", "phone", "Enter a phone number like (254) 555-0142.")));

        mockMvc.perform(put("/api/applicant/profile").principal(() -> "jordan.lee@example.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"firstName\": \"\", \"lastName\": \"Lee\", \"phone\": \"abc\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.firstName").value("Enter your first name."))
                .andExpect(jsonPath("$.phone").value("Enter a phone number like (254) 555-0142."));
    }
}
