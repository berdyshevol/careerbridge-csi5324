package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.ResumeSnapshot;
import baylor.csi5324.careerbridge.service.ApplicationService;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ApplicantApplicationsControllerTest {

    private final ApplicationService applicationService = mock(ApplicationService.class);
    private final MockMvc mockMvc = MockMvcBuilders
            .standaloneSetup(new ApplicantApplicationsController(applicationService)).build();

    @Test
    void listsTheApplicationsWithTheirPostings() throws Exception {
        JobPosting posting = new JobPosting();
        posting.setJobPostId(7L);
        posting.setTitle("Backend Developer");
        posting.setLocation("Remote");
        posting.setEmploymentType("Full-time");
        posting.setOrganization(new Organization("Brazos Analytics"));
        when(applicationService.viewApplications("jordan.lee@example.com")).thenReturn(List.of(new Application(
                new Applicant(), posting, new ResumeSnapshot("cv.pdf", "application/pdf", 2048L), LocalDate.now())));

        mockMvc.perform(get("/api/applicant/applications").principal(() -> "jordan.lee@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].postingId").value(7))
                .andExpect(jsonPath("$[0].title").value("Backend Developer"))
                .andExpect(jsonPath("$[0].organizationName").value("Brazos Analytics"))
                .andExpect(jsonPath("$[0].location").value("Remote"))
                .andExpect(jsonPath("$[0].employmentType").value("Full-time"))
                .andExpect(jsonPath("$[0].applicationStatus").value("APPLIED"));
    }
}
