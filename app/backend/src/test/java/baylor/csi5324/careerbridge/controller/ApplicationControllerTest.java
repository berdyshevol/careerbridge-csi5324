package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.ResumeSnapshot;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.service.ApplicationRefusal;
import baylor.csi5324.careerbridge.service.ApplicationRefusedException;
import baylor.csi5324.careerbridge.service.ApplicationStart;
import baylor.csi5324.careerbridge.service.ApplicationService;
import baylor.csi5324.careerbridge.service.SubmittedApplication;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
    void anEmptyResumeCountsAsNoResume() throws Exception {
        when(applicationService.submitApplication(eq(2L), isNull(), eq("jordan.lee@example.com")))
                .thenThrow(new ApplicationRefusedException(ApplicationRefusal.NO_RESUME));
        String empty = """
                {"resumeFileName": " ", "resumeFileType": "application/pdf", "resumeFileSize": 0}
                """;

        mockMvc.perform(post("/api/postings/2/application").principal(() -> "jordan.lee@example.com").contentType(MediaType.APPLICATION_JSON).content(empty))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.reason").value("NO_RESUME"));
    }

    @Test
    void theApplicationEndpointAnswersWithTheSummaryAsJson() throws Exception {
        when(applicationService.startApplication(eq(2L), any(ResumeSnapshot.class), eq("jordan.lee@example.com")))
                .thenReturn(new ApplicationStart(posting(), jordan(),
                        new ResumeSnapshot("cv.pdf", "application/pdf", 2048L), List.of(), null));

        mockMvc.perform(get("/api/postings/2/application").principal(() -> "jordan.lee@example.com")
                        .param("resumeFileName", "cv.pdf")
                        .param("resumeFileType", "application/pdf")
                        .param("resumeFileSize", "2048"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.posting.title").value("Software Engineer"))
                .andExpect(jsonPath("$.posting.organizationName").value("Acme"))
                .andExpect(jsonPath("$.applicant.email").value("jordan.lee@example.com"))
                .andExpect(jsonPath("$.resume.fileName").value("cv.pdf"))
                .andExpect(jsonPath("$.activeApplicationCount").value(0))
                .andExpect(jsonPath("$.applicationLimit").value(5))
                .andExpect(jsonPath("$.refusal").doesNotExist());
    }

    @Test
    void theSummaryNamesWhyTheApplicationCannotGoAhead() throws Exception {
        when(applicationService.startApplication(eq(2L), isNull(), eq("jordan.lee@example.com")))
                .thenReturn(new ApplicationStart(posting(), jordan(), null, List.of(),
                        ApplicationRefusal.NO_RESUME));

        mockMvc.perform(get("/api/postings/2/application").principal(() -> "jordan.lee@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.refusal.reason").value("NO_RESUME"))
                .andExpect(jsonPath("$.refusal.message").value(ApplicationRefusal.NO_RESUME.message()))
                .andExpect(jsonPath("$.resume").doesNotExist());
    }

    @Test
    void submittingToTheApplicationEndpointAnswersWithTheNewApplication() throws Exception {
        Application application = new Application(new Applicant(), new JobPosting(),
                new ResumeSnapshot("cv.pdf", "application/pdf", 2048L), LocalDate.now());
        when(applicationService.submitApplication(eq(2L), any(ResumeSnapshot.class), eq("jordan.lee@example.com")))
                .thenReturn(new SubmittedApplication(application, 3));

        mockMvc.perform(post("/api/postings/2/application").principal(() -> "jordan.lee@example.com").contentType(MediaType.APPLICATION_JSON)
                        .content(RESUME_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.applicationStatus").value("APPLIED"))
                .andExpect(jsonPath("$.activeApplicationCount").value(3));
    }

    @Test
    void aRefusalOnTheApplicationEndpointNamesItsReasonAsJson() throws Exception {
        when(applicationService.submitApplication(eq(2L), any(ResumeSnapshot.class), eq("jordan.lee@example.com")))
                .thenThrow(new ApplicationRefusedException(ApplicationRefusal.LIMIT_REACHED));

        mockMvc.perform(post("/api/postings/2/application").principal(() -> "jordan.lee@example.com").contentType(MediaType.APPLICATION_JSON)
                        .content(RESUME_JSON))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.reason").value("LIMIT_REACHED"))
                .andExpect(jsonPath("$.message").value(ApplicationRefusal.LIMIT_REACHED.message()));
    }

    private static JobPosting posting() {
        JobPosting posting = new JobPosting();
        posting.setJobPostId(2L);
        posting.setTitle("Software Engineer");
        posting.setOrganization(new Organization("Acme"));
        return posting;
    }

    private static Applicant jordan() {
        Applicant applicant = new Applicant();
        applicant.setFirstName("Jordan");
        applicant.setLastName("Lee");
        applicant.setEmail("jordan.lee@example.com");
        applicant.setPhone("(254) 555-0142");
        return applicant;
    }
}
