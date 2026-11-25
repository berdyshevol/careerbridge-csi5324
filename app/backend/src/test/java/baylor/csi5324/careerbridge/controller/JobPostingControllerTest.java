package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.dto.PostingSearchCriteria;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.model.Recruiter;
import baylor.csi5324.careerbridge.service.InvalidPostingException;
import baylor.csi5324.careerbridge.service.PostingNotFoundException;
import baylor.csi5324.careerbridge.service.PostingStateConflictException;
import baylor.csi5324.careerbridge.service.JobPostingService;
import baylor.csi5324.careerbridge.service.PostingNotAllowedException;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class JobPostingControllerTest {

    private final JobPostingService jobPostingService = mock(JobPostingService.class);
    private final MockMvc mockMvc =
            MockMvcBuilders.standaloneSetup(new JobPostingController(jobPostingService)).build();

    @Test
    void searchPassesEveryQueryCriterionToTheService() throws Exception {
        mockMvc.perform(get("/api/postings")
                        .param("keyword", "java")
                        .param("location", "Remote")
                        .param("organization", "Brazos")
                        .param("employmentType", "Internship"))
                .andExpect(status().isOk());

        verify(jobPostingService).searchPostings(
                new PostingSearchCriteria("java", "Remote", "Brazos", "Internship"));
    }

    @Test
    void searchWithoutCriteriaAsksForAnyPosting() throws Exception {
        mockMvc.perform(get("/api/postings")).andExpect(status().isOk());

        verify(jobPostingService).searchPostings(PostingSearchCriteria.ANY);
    }

    @Test
    void thePublicListShowsThePostingButNotWhoApprovedIt() throws Exception {
        when(jobPostingService.searchPostings(any())).thenReturn(List.of(approvedPosting()));

        mockMvc.perform(get("/api/postings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Backend Developer"))
                .andExpect(jsonPath("$[0].organization.name").value("Brazos Analytics"))
                .andExpect(jsonPath("$[0].approvedBy").doesNotExist())
                .andExpect(jsonPath("$[0].approvedAt").doesNotExist())
                .andExpect(jsonPath("$[0].reviewComment").doesNotExist())
                .andExpect(jsonPath("$[0].organization.organizationStatus").doesNotExist());
    }

    @Test
    void aPostingsDetailsLeaveOutTheAdministratorsReview() throws Exception {
        when(jobPostingService.viewPosting(7L)).thenReturn(approvedPosting());

        mockMvc.perform(get("/api/postings/7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.numberOfOpenings").value(2))
                .andExpect(jsonPath("$.applicationDeadline").value("2026-12-31"))
                .andExpect(jsonPath("$.reviewComment").doesNotExist());
    }

    @Test
    void anUnknownOrUnpublishedPostingIsNotFound() throws Exception {
        when(jobPostingService.viewPosting(anyLong())).thenThrow(new PostingNotFoundException(99L));

        mockMvc.perform(get("/api/postings/99")).andExpect(status().isNotFound());
    }

    @Test
    void anInvalidPostingIsABadRequestWithItsReason() throws Exception {
        when(jobPostingService.createPosting(any(), any()))
                .thenThrow(new InvalidPostingException("Job title is required"));

        mockMvc.perform(aPosting())
                .andExpect(status().isBadRequest())
                // The form tells a reason for the recruiter from an error report by this type
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_PLAIN))
                .andExpect(content().string("Job title is required"));
    }

    @Test
    void anotherRecruitersPostingIsForbiddenWithItsReason() throws Exception {
        when(jobPostingService.submitJobPosting(7L, "other@example.com"))
                .thenThrow(new PostingNotAllowedException("Only the recruiter who created this posting can submit it"));

        mockMvc.perform(post("/api/postings/7/submit").principal(() -> "other@example.com"))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_PLAIN))
                .andExpect(content().string("Only the recruiter who created this posting can submit it"));
    }

    @Test
    void closingPassesTheLoggedInRecruiterAndAnswersWithThePosting() throws Exception {
        JobPosting closed = approvedPosting();
        closed.setPostStatus(PostStatus.CLOSED);
        closed.setClosingReason("Closed by recruiter");
        when(jobPostingService.closePosting(7L, "owner@example.com")).thenReturn(closed);

        mockMvc.perform(post("/api/postings/7/close").principal(() -> "owner@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.postStatus").value("CLOSED"))
                .andExpect(jsonPath("$.closingReason").value("Closed by recruiter"));
    }

    @Test
    void closingAPostingThatIsNotPublishedIsAConflictWithItsReason() throws Exception {
        when(jobPostingService.closePosting(7L, "owner@example.com"))
                .thenThrow(new PostingStateConflictException("Only a published posting can be closed; this one is Draft"));

        mockMvc.perform(post("/api/postings/7/close").principal(() -> "owner@example.com"))
                .andExpect(status().isConflict())
                .andExpect(content().string("Only a published posting can be closed; this one is Draft"));
    }

    @Test
    void reopeningAPostingSendsTheAdministratorsComment() throws Exception {
        JobPosting returned = approvedPosting();
        returned.setPostStatus(PostStatus.RETURNED);
        returned.setReviewComment("Add the salary range");
        when(jobPostingService.openPostingForEdit(7L, "owner@example.com")).thenReturn(returned);

        mockMvc.perform(get("/api/postings/7/edit").principal(() -> "owner@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.postStatus").value("RETURNED"))
                .andExpect(jsonPath("$.reviewComment").value("Add the salary range"));
    }

    @Test
    void changingAPostingPassesTheDetailsAndTheLoggedInRecruiter() throws Exception {
        when(jobPostingService.updatePosting(eq(7L), any(), eq("owner@example.com"))).thenReturn(approvedPosting());

        mockMvc.perform(put("/api/postings/7").principal(() -> "owner@example.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"Backend Developer\", \"numberOfOpenings\": 2}"))
                .andExpect(status().isOk());

        verify(jobPostingService).updatePosting(eq(7L),
                argThat(request -> "Backend Developer".equals(request.title()) && request.numberOfOpenings() == 2),
                eq("owner@example.com"));
    }

    @Test
    void theRecruiterIsNeverSentWithAPosting() throws Exception {
        JobPosting posting = approvedPosting();
        Recruiter recruiter = new Recruiter();
        recruiter.setEmail("owner@example.com");
        recruiter.setPasswordHash("secret-hash");
        posting.setRecruiter(recruiter);
        when(jobPostingService.createPosting(any(), any())).thenReturn(posting);

        mockMvc.perform(aPosting())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.recruiter").doesNotExist())
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("secret-hash"))));
    }

    @Test
    void anyOtherFailureIsNotBlamedOnTheRecruiter() {
        when(jobPostingService.createPosting(any(), any()))
                .thenThrow(new IllegalArgumentException("internal detail"));

        assertThrows(ServletException.class, () -> mockMvc.perform(aPosting()));
    }

    private static MockHttpServletRequestBuilder aPosting() {
        return post("/api/postings")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"organizationId\": 1, \"title\": \"\", \"numberOfOpenings\": 1}")
                .principal(() -> "owner@example.com");
    }

    private static JobPosting approvedPosting() {
        Organization organization = new Organization("Brazos Analytics");
        organization.setOrganizationStatus("ACTIVE");
        JobPosting posting = new JobPosting();
        posting.setOrganization(organization);
        posting.setTitle("Backend Developer");
        posting.setNumberOfOpenings(2);
        posting.setApplicationDeadline(LocalDate.of(2026, 12, 31));
        posting.setPostStatus(PostStatus.PUBLISHED);
        posting.setApprovedBy("Test Administrator");
        posting.setApprovedAt(LocalDateTime.of(2026, 10, 10, 9, 0));
        posting.setReviewComment("Looks good");
        return posting;
    }
}
