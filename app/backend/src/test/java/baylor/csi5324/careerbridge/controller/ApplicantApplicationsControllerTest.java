package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.ResumeSnapshot;
import baylor.csi5324.careerbridge.model.StatusHistoryEntry;
import baylor.csi5324.careerbridge.service.ApplicantApplications;
import baylor.csi5324.careerbridge.service.ApplicationService;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ApplicantApplicationsControllerTest {

    private final ApplicationService applicationService = mock(ApplicationService.class);
    private final MockMvc mockMvc = MockMvcBuilders.standaloneSetup(
            new ApplicantApplicationsController(applicationService)).build();

    @Test
    void returnsApplicationsWithDatesAndActiveApplicationCount() throws Exception {
        JobPosting posting = new JobPosting();
        posting.setJobPostId(4L);
        posting.setTitle("Data Analyst");
        posting.setOrganization(new Organization("Brazos Health"));
        posting.setLocation("On-site");
        posting.setEmploymentType("Full-time");

        Application application = new Application(
                new Applicant(),
                posting,
                new ResumeSnapshot("cv.pdf", "application/pdf", 1024L),
                LocalDate.of(2026, 10, 1));
        application.setApplicationStatus(ApplicationStatus.OFFER);
        application.getStatusHistory().add(new StatusHistoryEntry(ApplicationStatus.OFFER, LocalDate.of(2026, 10, 28)));

        when(applicationService.viewApplications("jordan.lee@example.com"))
                .thenReturn(new ApplicantApplications(List.of(application), 1));

        mockMvc.perform(get("/api/applicant/applications").principal(() -> "jordan.lee@example.com"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.activeApplicationCount").value(1))
                .andExpect(jsonPath("$.applicationLimit").value(5))
                .andExpect(jsonPath("$.applications[0].postingId").value(4))
                .andExpect(jsonPath("$.applications[0].title").value("Data Analyst"))
                .andExpect(jsonPath("$.applications[0].organizationName").value("Brazos Health"))
                .andExpect(jsonPath("$.applications[0].applicationStatus").value("OFFER"))
                .andExpect(jsonPath("$.applications[0].dateApplied").value("2026-10-01"))
                .andExpect(jsonPath("$.applications[0].lastStageChangeDate").value("2026-10-28"));
    }
}
