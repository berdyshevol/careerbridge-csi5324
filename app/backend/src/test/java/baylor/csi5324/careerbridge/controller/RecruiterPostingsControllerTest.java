package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.service.RecruiterPostings;
import baylor.csi5324.careerbridge.service.RecruiterPostingsService;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class RecruiterPostingsControllerTest {

    private final RecruiterPostingsService service = mock(RecruiterPostingsService.class);
    private final MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new RecruiterPostingsController(service)).build();

    @Test
    void returnsThePostingsOfTheOrganizationWithTheirStatusAndStageCounts() throws Exception {
        Organization organization = new Organization("Waco Health Partners");
        JobPosting open = posting(7L, "Data Analyst", PostStatus.PUBLISHED, organization);
        JobPosting filled = posting(8L, "Front Desk Coordinator", PostStatus.CLOSED, organization);
        filled.setClosingReason("Filled");
        Map<ApplicationStatus, Long> counts = new EnumMap<>(ApplicationStatus.class);
        counts.put(ApplicationStatus.APPLIED, 7L);
        counts.put(ApplicationStatus.SCREENING, 0L);
        counts.put(ApplicationStatus.INTERVIEW, 3L);
        counts.put(ApplicationStatus.OFFER, 1L);
        when(service.listPostings("riley.chen@example.com")).thenReturn(new RecruiterPostings(organization, List.of(
                new RecruiterPostings.RecruiterPosting(open, counts),
                new RecruiterPostings.RecruiterPosting(filled, new EnumMap<>(ApplicationStatus.class)))));

        mockMvc.perform(get("/api/recruiter/postings").principal(() -> "riley.chen@example.com"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.organizationName").value("Waco Health Partners"))
                .andExpect(jsonPath("$.postings[0].postingId").value(7))
                .andExpect(jsonPath("$.postings[0].title").value("Data Analyst"))
                .andExpect(jsonPath("$.postings[0].postStatus").value("PUBLISHED"))
                .andExpect(jsonPath("$.postings[0].applicationsByStage.APPLIED").value(7))
                .andExpect(jsonPath("$.postings[0].applicationsByStage.SCREENING").value(0))
                .andExpect(jsonPath("$.postings[0].applicationsByStage.OFFER").value(1))
                .andExpect(jsonPath("$.postings[1].postStatus").value("CLOSED"))
                .andExpect(jsonPath("$.postings[1].closingReason").value("Filled"));
    }

    @Test
    void anOrganizationlessRecruiterGetsAnEmptyListAndNoName() throws Exception {
        when(service.listPostings("riley.chen@example.com"))
                .thenReturn(new RecruiterPostings(null, List.of()));

        mockMvc.perform(get("/api/recruiter/postings").principal(() -> "riley.chen@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.organizationName").doesNotExist())
                .andExpect(jsonPath("$.postings").isEmpty());
    }

    private static JobPosting posting(Long id, String title, PostStatus postStatus, Organization organization) {
        JobPosting posting = new JobPosting();
        posting.setJobPostId(id);
        posting.setTitle(title);
        posting.setPostStatus(postStatus);
        posting.setOrganization(organization);
        return posting;
    }
}
