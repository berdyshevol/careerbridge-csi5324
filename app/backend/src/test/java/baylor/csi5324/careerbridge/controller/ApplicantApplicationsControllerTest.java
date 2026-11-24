package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.Interview;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.ResumeSnapshot;
import baylor.csi5324.careerbridge.model.StatusHistoryEntry;
import baylor.csi5324.careerbridge.service.ApplicantApplications;
import baylor.csi5324.careerbridge.service.ApplicationActionRefusedException;
import baylor.csi5324.careerbridge.service.ApplicationNotFoundException;
import baylor.csi5324.careerbridge.service.ApplicationService;
import baylor.csi5324.careerbridge.service.WithdrawalPrompt;
import baylor.csi5324.careerbridge.service.WithdrawnApplication;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

    @Test
    void returnsApplicationDetailsWithStageHistoryAndInterviewsWithoutOutcomesOrNotes() throws Exception {
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
        application.setApplicationStatus(ApplicationStatus.INTERVIEW);
        application.getStatusHistory().add(new StatusHistoryEntry(ApplicationStatus.SCREENING, LocalDate.of(2026, 10, 8)));
        application.getStatusHistory().add(new StatusHistoryEntry(ApplicationStatus.INTERVIEW, LocalDate.of(2026, 10, 15)));
        Interview interview = new Interview(application, 1, LocalDateTime.of(2026, 10, 21, 14, 0),
                "On-site", "1200 Austin Ave, Waco");
        interview.setOutcome("Passed");
        interview.setNotes("Secret recruiter note");
        application.getInterviews().add(interview);

        when(applicationService.viewApplication(42L, "jordan.lee@example.com")).thenReturn(application);

        mockMvc.perform(get("/api/applicant/applications/42").principal(() -> "jordan.lee@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Data Analyst"))
                .andExpect(jsonPath("$.applicationStatus").value("INTERVIEW"))
                .andExpect(jsonPath("$.statusHistory.length()").value(3))
                .andExpect(jsonPath("$.interviews[0].format").value("On-site"))
                .andExpect(jsonPath("$.interviews[0].location").value("1200 Austin Ave, Waco"))
                .andExpect(jsonPath("$.interviews[0].outcome").doesNotExist())
                .andExpect(jsonPath("$.interviews[0].notes").doesNotExist())
                .andExpect(jsonPath("$.availableActions[0]").value("WITHDRAW"));
    }

    @Test
    void returnsNotFoundWhenAnotherApplicantsApplicationIsRequested() throws Exception {
        when(applicationService.viewApplication(99L, "sam.rivera@example.com"))
                .thenThrow(new ApplicationNotFoundException(99L));

        mockMvc.perform(get("/api/applicant/applications/99").principal(() -> "sam.rivera@example.com"))
                .andExpect(status().isNotFound());
    }

    @Test
    void returnsWithdrawalPromptAndWithdrawsApplication() throws Exception {
        JobPosting posting = new JobPosting();
        posting.setJobPostId(4L);
        posting.setTitle("Data Analyst");
        posting.setOrganization(new Organization("Brazos Health"));
        posting.setLocation("On-site");
        posting.setEmploymentType("Full-time");

        Application active = new Application(new Applicant(), posting,
                new ResumeSnapshot("cv.pdf", "application/pdf", 1024L), LocalDate.of(2026, 10, 1));
        when(applicationService.requestWithdrawal(12L, "jordan.lee@example.com"))
                .thenReturn(new WithdrawalPrompt(active, WithdrawalPrompt.WARNING, WithdrawalPrompt.REASONS));

        mockMvc.perform(get("/api/applicant/applications/12/withdrawal").principal(() -> "jordan.lee@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Data Analyst"))
                .andExpect(jsonPath("$.warning").value(WithdrawalPrompt.WARNING))
                .andExpect(jsonPath("$.reasons.length()").value(3));

        Application withdrawn = new Application(new Applicant(), posting,
                new ResumeSnapshot("cv.pdf", "application/pdf", 1024L), LocalDate.of(2026, 10, 1));
        withdrawn.setApplicationStatus(ApplicationStatus.WITHDRAWN);
        withdrawn.setWithdrawnAt(Instant.parse("2026-10-10T15:00:00Z"));
        when(applicationService.withdrawApplication(12L, "jordan.lee@example.com", "No longer interested"))
                .thenReturn(new WithdrawnApplication(withdrawn, 2));

        mockMvc.perform(post("/api/applicant/applications/12/withdraw")
                        .principal(() -> "jordan.lee@example.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"No longer interested\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeApplicationCount").value(2))
                .andExpect(jsonPath("$.applicationLimit").value(5))
                .andExpect(jsonPath("$.application.applicationStatus").value("WITHDRAWN"));
    }

    @Test
    void returnsConflictWhenApplicationIsNoLongerWithdrawable() throws Exception {
        when(applicationService.withdrawApplication(12L, "jordan.lee@example.com", null))
                .thenThrow(new ApplicationActionRefusedException(
                        ApplicationStatus.OFFER, "This application is at the Offer stage."));

        mockMvc.perform(post("/api/applicant/applications/12/withdraw")
                        .principal(() -> "jordan.lee@example.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.currentStage").value("OFFER"))
                .andExpect(jsonPath("$.message").value("This application is at the Offer stage."));
    }
}
