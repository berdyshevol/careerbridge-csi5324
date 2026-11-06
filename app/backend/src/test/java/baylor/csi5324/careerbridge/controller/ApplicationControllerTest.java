package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.controller.dto.ApplicationDetailResponse;
import baylor.csi5324.careerbridge.controller.dto.ApplicationListResponse;
import baylor.csi5324.careerbridge.controller.dto.ApplicationSummaryResponse;
import baylor.csi5324.careerbridge.controller.dto.OfferDecisionResponse;
import baylor.csi5324.careerbridge.controller.dto.OfferResponse;
import baylor.csi5324.careerbridge.controller.dto.StatusHistoryEntryResponse;
import baylor.csi5324.careerbridge.controller.dto.WithdrawalRequestResponse;
import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.OfferStatus;
import baylor.csi5324.careerbridge.model.ResumeSnapshot;
import baylor.csi5324.careerbridge.service.ApplicationNotFoundException;
import baylor.csi5324.careerbridge.service.ApplicationRefusedException;
import baylor.csi5324.careerbridge.service.ApplicationService;
import baylor.csi5324.careerbridge.service.SubmittedApplication;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
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

    @Test
    void listsTheApplicantsApplicationsAndActiveCount() throws Exception {
        LocalDate today = LocalDate.of(2026, 10, 14);
        ApplicationSummaryResponse summary = new ApplicationSummaryResponse(
                1L, 4L, "IT Support Specialist", "Waco Health Partners",
                "On-site", "Part-time", today, ApplicationStatus.OFFER, today, true);
        when(applicationService.viewApplications())
                .thenReturn(new ApplicationListResponse(List.of(summary), 1));

        mockMvc.perform(get("/api/applications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeApplicationCount").value(1))
                .andExpect(jsonPath("$.applications[0].title").value("IT Support Specialist"))
                .andExpect(jsonPath("$.applications[0].applicationStatus").value("OFFER"));
    }

    @Test
    void returns404WhenApplicationDoesNotBelongToApplicant() throws Exception {
        when(applicationService.viewApplication(99L))
                .thenThrow(new ApplicationNotFoundException(99L));

        mockMvc.perform(get("/api/applications/99"))
                .andExpect(status().isNotFound())
                .andExpect(content().string("Application not found: 99"));
    }

    @Test
    void withdrawsAnApplicationWithOptionalReason() throws Exception {
        LocalDate today = LocalDate.of(2026, 10, 14);
        ApplicationDetailResponse response = new ApplicationDetailResponse(
                2L, 3L, "Backend Developer", "Brazos Analytics", "Remote", "Full-time",
                today, ApplicationStatus.WITHDRAWN, today, null, null, null,
                Instant.parse("2026-10-14T12:00:00Z"), "Accepted another offer",
                List.of(new StatusHistoryEntryResponse(ApplicationStatus.WITHDRAWN, today, "Accepted another offer")),
                List.of(), null, List.of(), 2);
        when(applicationService.withdrawApplication(2L, "Accepted another offer"))
                .thenReturn(response);

        mockMvc.perform(post("/api/applications/2/withdraw")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\": \"Accepted another offer\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applicationStatus").value("WITHDRAWN"))
                .andExpect(jsonPath("$.activeApplicationCount").value(2));
    }

    @Test
    void returnsWithdrawalPreviewAndFinalWarning() throws Exception {
        when(applicationService.requestWithdrawal(2L))
                .thenReturn(new WithdrawalRequestResponse(
                        2L, 3L, "Backend Developer", "Brazos Analytics",
                        ApplicationStatus.INTERVIEW, WithdrawalRequestResponse.FINAL_WITHDRAWAL_WARNING));

        mockMvc.perform(get("/api/applications/2/withdrawal"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Backend Developer"))
                .andExpect(jsonPath("$.warning").value(WithdrawalRequestResponse.FINAL_WITHDRAWAL_WARNING));
    }

    @Test
    void viewsAndRespondsToAnOffer() throws Exception {
        LocalDate today = LocalDate.of(2026, 10, 14);
        OfferResponse offer = new OfferResponse(
                1L, 1L, 4L, "IT Support Specialist", "Waco Health Partners",
                "On-site", "Part-time", ApplicationStatus.OFFER,
                today.minusDays(5), today.plusDays(5), today.plusDays(20),
                "$25 per hour", "Part-time schedule", OfferStatus.EXTENDED, null, true);
        when(applicationService.viewOffer(1L)).thenReturn(offer);
        when(applicationService.acceptOffer(1L, null, null))
                .thenReturn(new OfferDecisionResponse(1L, ApplicationStatus.HIRED, OfferStatus.ACCEPTED, today, true, 2));
        when(applicationService.declineOffer(1L, "No longer interested"))
                .thenReturn(new OfferDecisionResponse(1L, ApplicationStatus.OFFER_DECLINED, OfferStatus.DECLINED, today, false, 2));

        mockMvc.perform(get("/api/applications/1/offer"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.salary").value("$25 per hour"));

        mockMvc.perform(post("/api/applications/1/offer/accept"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applicationStatus").value("HIRED"))
                .andExpect(jsonPath("$.postingClosed").value(true));

        mockMvc.perform(post("/api/applications/1/offer/decline")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\": \"No longer interested\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applicationStatus").value("OFFER_DECLINED"))
                .andExpect(jsonPath("$.postingClosed").value(false));
    }
}
