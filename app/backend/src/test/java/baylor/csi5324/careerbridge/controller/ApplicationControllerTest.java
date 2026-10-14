package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.ResumeSnapshot;
import baylor.csi5324.careerbridge.service.ApplicationRefusedException;
import baylor.csi5324.careerbridge.service.ApplicationService;
import baylor.csi5324.careerbridge.service.SubmittedApplication;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ApplicationControllerTest {

    private static final String RESUME_JSON = """
            {"resumeFileName": "cv.pdf", "resumeFileType": "application/pdf", "resumeFileSize": 2048}
            """;

    private ApplicationService applicationService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        applicationService = mock(ApplicationService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new ApplicationController(applicationService)).build();
    }

    @Test
    void answersWithTheNewApplicationAndTheActiveCount() throws Exception {
        Application application = new Application(new Applicant(), new JobPosting(),
                new ResumeSnapshot("cv.pdf", "application/pdf", 2048L), LocalDate.now());
        when(applicationService.submitApplication(eq(2L), any(ResumeSnapshot.class)))
                .thenReturn(new SubmittedApplication(application, 4));

        mockMvc.perform(post("/api/postings/2/apply").contentType(MediaType.APPLICATION_JSON).content(RESUME_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.applicationStatus").value("APPLIED"))
                .andExpect(jsonPath("$.activeApplicationCount").value(4));
    }

    @Test
    void passesNoResumeWhenNoneIsSent() throws Exception {
        when(applicationService.submitApplication(eq(2L), isNull()))
                .thenThrow(new ApplicationRefusedException("A resume is required to apply."));

        mockMvc.perform(post("/api/postings/2/apply").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("A resume is required to apply."));
    }

    @Test
    void anEmptyResumeCountsAsNoResume() throws Exception {
        when(applicationService.submitApplication(eq(2L), isNull()))
                .thenThrow(new ApplicationRefusedException("A resume is required to apply."));
        String empty = """
                {"resumeFileName": " ", "resumeFileType": "application/pdf", "resumeFileSize": 0}
                """;

        mockMvc.perform(post("/api/postings/2/apply").contentType(MediaType.APPLICATION_JSON).content(empty))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("A resume is required to apply."));
    }

    @Test
    void aRefusalIsPlainTextForTheApplicant() throws Exception {
        when(applicationService.submitApplication(eq(2L), any(ResumeSnapshot.class)))
                .thenThrow(new ApplicationRefusedException("This posting no longer accepts applications."));

        mockMvc.perform(post("/api/postings/2/apply").contentType(MediaType.APPLICATION_JSON).content(RESUME_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_PLAIN))
                .andExpect(content().string("This posting no longer accepts applications."));
    }
}
