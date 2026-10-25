package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class AdminJobPostingControllerTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private JobPostingRepository jobPostingRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void theQueueNeedsAnAdministrator() throws Exception {
        mockMvc.perform(get("/api/admin/postings/pending"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/admin/postings/pending").with(asRecruiter()))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/postings/pending").with(asAdministrator()))
                .andExpect(status().isOk());
    }

    @Test
    void approvalRecordsTheSignedInAdministrator() throws Exception {
        JobPosting pending = savePending();

        mockMvc.perform(post("/api/admin/postings/{id}/approve", pending.getJobPostId())
                        .with(asAdministrator()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.postStatus").value("PUBLISHED"))
                .andExpect(jsonPath("$.approvedBy").value("root@careerbridge.example"));
    }

    @Test
    void aRejectionWithoutAReasonIsABadRequestWithItsReason() throws Exception {
        JobPosting pending = savePending();

        mockMvc.perform(post("/api/admin/postings/{id}/reject", pending.getJobPostId())
                        .with(asAdministrator())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"comment\": \" \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_PLAIN));

        assertEquals(PostStatus.PENDING_APPROVAL,
                jobPostingRepository.findById(pending.getJobPostId()).orElseThrow().getPostStatus());
    }

    @Test
    void aPostingAlreadyDecidedIsAConflictThatNamesItsStatus() throws Exception {
        JobPosting pending = savePending();
        pending.setPostStatus(PostStatus.PUBLISHED);
        jobPostingRepository.save(pending);

        mockMvc.perform(post("/api/admin/postings/{id}/approve", pending.getJobPostId())
                        .with(asAdministrator()))
                .andExpect(status().isConflict())
                .andExpect(content().string("This posting was already decided: it is Published"));
    }

    @Test
    void theFrontendMaySendCredentialsFromAnotherOrigin() throws Exception {
        mockMvc.perform(options("/api/admin/postings/pending")
                        .header(HttpHeaders.ORIGIN, "http://localhost:3000")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:3000"));
    }

    @Test
    void theH2ConsoleMayDrawItsFrames() throws Exception {
        mockMvc.perform(get("/api/postings"))
                .andExpect(header().string("X-Frame-Options", "SAMEORIGIN"));
    }

    private JobPosting savePending() {
        Organization organization = organizationRepository.findAll().get(0);
        JobPosting posting = new JobPosting();
        posting.setTitle("Software Engineer");
        posting.setNumberOfOpenings(1);
        posting.setDatePosted(LocalDate.now());
        posting.setApplicationDeadline(LocalDate.now().plusDays(10));
        posting.setPostStatus(PostStatus.PENDING_APPROVAL);
        posting.setOrganization(organization);
        return jobPostingRepository.save(posting);
    }

    private static RequestPostProcessor asAdministrator() {
        return jwt().jwt(token -> token.subject("root@careerbridge.example"))
                .authorities(new SimpleGrantedAuthority("ROLE_ADMINISTRATOR"));
    }

    private static RequestPostProcessor asRecruiter() {
        return jwt().authorities(new SimpleGrantedAuthority("ROLE_RECRUITER"));
    }
}
