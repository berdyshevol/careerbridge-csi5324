package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.dto.PostingSearchCriteria;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.service.InvalidPostingException;
import baylor.csi5324.careerbridge.service.PostingNotFoundException;
import baylor.csi5324.careerbridge.service.JobPostingService;
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
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
        when(jobPostingService.createPosting(any()))
                .thenThrow(new InvalidPostingException("Job title is required"));

        mockMvc.perform(aPosting())
                .andExpect(status().isBadRequest())
                // The form tells a reason for the recruiter from an error report by this type
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_PLAIN))
                .andExpect(content().string("Job title is required"));
    }

    @Test
    void anyOtherFailureIsNotBlamedOnTheRecruiter() {
        when(jobPostingService.createPosting(any()))
                .thenThrow(new IllegalArgumentException("internal detail"));

        assertThrows(ServletException.class, () -> mockMvc.perform(aPosting()));
    }

    private static MockHttpServletRequestBuilder aPosting() {
        return post("/api/postings")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"organizationId\": 1, \"title\": \"\", \"numberOfOpenings\": 1}");
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
