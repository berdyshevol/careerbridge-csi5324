package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.dto.PostingSearchCriteria;
import baylor.csi5324.careerbridge.service.InvalidPostingException;
import baylor.csi5324.careerbridge.service.JobPostingService;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
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
}
