package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.Interview;
import baylor.csi5324.careerbridge.model.Lifecycles;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Offer;
import baylor.csi5324.careerbridge.model.OfferTerms;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.ResumeSnapshot;
import baylor.csi5324.careerbridge.service.ApplicantApplications;
import baylor.csi5324.careerbridge.model.ApplicationActionRefusedException;
import baylor.csi5324.careerbridge.service.ApplicationNotFoundException;
import baylor.csi5324.careerbridge.service.ApplicationService;
import baylor.csi5324.careerbridge.service.OfferResponseResult;
import baylor.csi5324.careerbridge.model.OfferRevisedException;
import baylor.csi5324.careerbridge.service.WithdrawalPrompt;
import baylor.csi5324.careerbridge.service.WithdrawnApplication;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ApplicantApplicationsControllerTest {

    private static final Instant NOW = Instant.parse("2026-10-30T15:00:00Z");
    private final ApplicationService applicationService = mock(ApplicationService.class);
    private final MockMvc mockMvc = MockMvcBuilders.standaloneSetup(
            new ApplicantApplicationsController(applicationService, Clock.fixed(NOW, ZoneOffset.UTC)))
            .setControllerAdvice(new ServiceExceptionHandlers()).build();

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
        Lifecycles.atStage(application, ApplicationStatus.INTERVIEW);
        application.extendOffer(Lifecycles.TERMS, Instant.parse("2026-10-28T15:00:00Z"));

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
        application.advance(ApplicationStatus.APPLIED, Instant.parse("2026-10-08T15:00:00Z"));
        application.advance(ApplicationStatus.SCREENING, Instant.parse("2026-10-15T15:00:00Z"));
        Interview interview = application.recordInterview(LocalDateTime.of(2026, 10, 21, 14, 0),
                "On-site", "1200 Austin Ave, Waco");
        interview.setOutcome("Passed");
        interview.setNotes("Secret recruiter note");

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
        withdrawn.withdraw(null, Instant.parse("2026-10-10T15:00:00Z"));
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

    @Test
    void returnsOfferDetailsAcceptsDeclinesAndReportsRevisedTerms() throws Exception {
        JobPosting posting = new JobPosting();
        posting.setJobPostId(4L);
        posting.setTitle("Data Analyst");
        posting.setOrganization(new Organization("Brazos Health"));
        posting.setLocation("On-site");
        posting.setEmploymentType("Full-time");

        Application offered = new Application(new Applicant(), posting,
                new ResumeSnapshot("cv.pdf", "application/pdf", 1024L), LocalDate.of(2026, 10, 1));
        Lifecycles.atStage(offered, ApplicationStatus.INTERVIEW);
        offered.extendOffer(new OfferTerms(LocalDate.of(2026, 12, 7), "68,000 USD per year",
                "Hybrid after 90 days.", LocalDate.of(2026, 11, 5), "Brazos_Health_Offer_Letter.pdf"),
                Instant.parse("2026-10-28T15:00:00Z"));
        when(applicationService.viewOffer(15L, "jordan.lee@example.com")).thenReturn(offered);

        mockMvc.perform(get("/api/applicant/applications/15/offer").principal(() -> "jordan.lee@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Data Analyst"))
                .andExpect(jsonPath("$.salary").value("68,000 USD per year"))
                .andExpect(jsonPath("$.expirationDate").value("2026-11-05"))
                .andExpect(jsonPath("$.canRespond").value(true));

        Application hired = new Application(new Applicant(), posting,
                new ResumeSnapshot("cv.pdf", "application/pdf", 1024L), LocalDate.of(2026, 10, 1));
        Lifecycles.atStage(hired, ApplicationStatus.INTERVIEW);
        hired.extendOffer(new OfferTerms(LocalDate.of(2026, 12, 7), "68,000 USD per year",
                "Hybrid after 90 days.", LocalDate.of(2026, 11, 5), null), Instant.parse("2026-10-28T15:00:00Z"));
        hired.acceptOffer(1, 0, NOW);
        when(applicationService.acceptOffer(15L, "jordan.lee@example.com", 1))
                .thenReturn(new OfferResponseResult(hired, 2, NOW));

        mockMvc.perform(post("/api/applicant/applications/15/offer/accept")
                        .principal(() -> "jordan.lee@example.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedRevision\":1}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.application.applicationStatus").value("HIRED"))
                .andExpect(jsonPath("$.application.offer.status").value("ACCEPTED"))
                .andExpect(jsonPath("$.activeApplicationCount").value(2));

        offered.reviseOffer(new OfferTerms(LocalDate.of(2026, 12, 14), "72,000 USD per year",
                "Updated terms.", LocalDate.of(2026, 11, 10), null), NOW);
        Offer revised = offered.getOffer();
        when(applicationService.declineOffer(15L, "jordan.lee@example.com", "Accepted another", 1))
                .thenThrow(new OfferRevisedException(revised, NOW, ZoneOffset.UTC));

        mockMvc.perform(post("/api/applicant/applications/15/offer/decline")
                        .principal(() -> "jordan.lee@example.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Accepted another\",\"expectedRevision\":1}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("OFFER_REVISED"))
                .andExpect(jsonPath("$.offer.salary").value("72,000 USD per year"))
                .andExpect(jsonPath("$.offer.revision").value(2));

        // Missing expectedRevision is refused with 400 so clients cannot bypass the revised-offer check (FR-UC07.11)
        mockMvc.perform(post("/api/applicant/applications/15/offer/accept")
                        .principal(() -> "jordan.lee@example.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/applicant/applications/15/offer/decline")
                        .principal(() -> "jordan.lee@example.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"No thanks\"}"))
                .andExpect(status().isBadRequest());
    }
}
