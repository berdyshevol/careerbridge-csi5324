package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.controller.dto.ApplicationResponse;
import baylor.csi5324.careerbridge.controller.dto.SubmitApplicationRequest;
import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.ResumeSnapshot;
import baylor.csi5324.careerbridge.service.ApplicationService;
import baylor.csi5324.careerbridge.service.DuplicateApplicationException;
import baylor.csi5324.careerbridge.service.PostingClosedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ApplicationControllerTest {

    private ApplicationService applicationService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        applicationService = mock(ApplicationService.class);
        ApplicationController controller = new ApplicationController(applicationService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void submitApplicationReturnsCreatedAndDetails() throws Exception {
        Applicant applicant = new Applicant();
        applicant.setUserId(1L);

        Organization org = new Organization("Acme Corp");
        JobPosting posting = new JobPosting();
        posting.setTitle("Software Engineer");
        posting.setOrganization(org);

        ResumeSnapshot resume = new ResumeSnapshot("resume.pdf", "application/pdf", 1024L);
        Application app = new Application(applicant, posting, resume, LocalDate.now());

        when(applicationService.submitApplication(eq(10L), eq(1L), any())).thenReturn(app);
        when(applicationService.getActiveApplicationCount(1L)).thenReturn(1L);

        String json = """
                {
                    \"applicantId\": 1,
                    \"resumeFileName\": \"resume.pdf\"
                }
                """;

        mockMvc.perform(post("/api/postings/10/apply")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.jobTitle").value("Software Engineer"))
                .andExpect(jsonPath("$.organizationName").value("Acme Corp"))
                .andExpect(jsonPath("$.applicationStatus").value("APPLIED"))
                .andExpect(jsonPath("$.resumeFileName").value("resume.pdf"))
                .andExpect(jsonPath("$.activeApplicationCount").value(1));
    }

    @Test
    void submitApplicationRejectsClosedPosting() throws Exception {
        when(applicationService.submitApplication(eq(99L), any(), any()))
                .thenThrow(new PostingClosedException(99L));

        mockMvc.perform(post("/api/postings/99/apply")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void submitApplicationRejectsDuplicate() throws Exception {
        when(applicationService.submitApplication(eq(10L), any(), any()))
                .thenThrow(new DuplicateApplicationException(10L));

        mockMvc.perform(post("/api/postings/10/apply")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isConflict());
    }

    @Test
    void checkAppliedReturnsTrueWhenApplied() throws Exception {
        when(applicationService.hasApplied(10L, 1L)).thenReturn(true);

        mockMvc.perform(get("/api/postings/10/applied?applicantId=1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applied").value(true));
    }

    @Test
    void activeCountReturnsCurrentCountAndLimit() throws Exception {
        when(applicationService.getActiveApplicationCount(1L)).thenReturn(2L);

        mockMvc.perform(get("/api/applications/active-count?applicantId=1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeCount").value(2))
                .andExpect(jsonPath("$.limit").value(5));
    }
}
