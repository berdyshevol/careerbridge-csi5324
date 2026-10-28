package baylor.csi5324.careerbridge.config;

import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// ADR-0010: every write asks for its role; reading postings, logging in and registering need none (BR-3)
@SpringBootTest
class AccessByRoleTest {

    private static final String RESUME = """
            {"resumeFileName": "cv.pdf", "resumeFileType": "application/pdf", "resumeFileSize": 2048}
            """;

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private OrganizationRepository organizationRepository;

    private MockMvc mockMvc;
    private String blankPosting;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        // An organization of its own: other tests share the database, so no id is certain to exist
        long organizationId = organizationRepository.save(new Organization("Access By Role " + System.nanoTime())).getOrganizationId();
        blankPosting = "{\"organizationId\": " + organizationId + ", \"title\": \" \", \"numberOfOpenings\": 1}";
    }

    private static RequestPostProcessor as(String role) {
        return jwt().jwt(token -> token.subject("jordan.lee@example.com"))
                .authorities(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Test
    void aVisitorReadsPostingsButWritesNothing() throws Exception {
        mockMvc.perform(get("/api/postings")).andExpect(status().isOk());
        mockMvc.perform(post("/api/postings/1/application").contentType(MediaType.APPLICATION_JSON).content(RESUME))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/applicant/applications")).andExpect(status().isUnauthorized());
        // A GET under /api/postings, yet it starts the applicant's own application (UC-04)
        mockMvc.perform(get("/api/postings/1/application")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/postings").contentType(MediaType.APPLICATION_JSON).content(blankPosting))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/postings/1/submit")).andExpect(status().isUnauthorized());
    }

    @Test
    void onlyAnApplicantApplies() throws Exception {
        mockMvc.perform(post("/api/postings/1/application").with(as("RECRUITER"))
                        .contentType(MediaType.APPLICATION_JSON).content(RESUME))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/postings/1/application").with(as("ADMINISTRATOR"))
                        .contentType(MediaType.APPLICATION_JSON).content(RESUME))
                .andExpect(status().isForbidden());
        // Reaches the service: an unknown posting is the applicant's 404, not a refused role
        mockMvc.perform(post("/api/postings/999999/application").with(as("APPLICANT"))
                        .contentType(MediaType.APPLICATION_JSON).content(RESUME))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/applicant/applications").with(as("ADMINISTRATOR")))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/applicant/applications").with(as("APPLICANT")))
                .andExpect(status().isOk());
    }

    @Test
    void onlyAnApplicantHasAProfile() throws Exception {
        mockMvc.perform(get("/api/applicant/profile")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/applicant/profile").with(as("RECRUITER"))).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/applicant/profile").with(as("APPLICANT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("jordan.lee@example.com"));
    }

    @Test
    void loggingInAndRegisteringNeedNoToken() throws Exception {
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"riley.chen@example.com\", \"password\": \"Recruiter-test-1\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/applicants").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\": \"Pat Kim\", \"email\": \"pat-role-" + System.nanoTime()
                                + "@example.com\", \"password\": \"Sunrise-2026x\"}"))
                .andExpect(status().isCreated());
    }

    @Test
    void onlyARecruiterCreatesAPosting() throws Exception {
        mockMvc.perform(post("/api/postings").with(as("APPLICANT"))
                        .contentType(MediaType.APPLICATION_JSON).content(blankPosting))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/postings/1/submit").with(as("APPLICANT"))).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/postings/1/submit").with(as("ADMINISTRATOR"))).andExpect(status().isForbidden());
        // Reaches the service, which refuses the blank title: the recruiter's mistake, in plain text
        mockMvc.perform(post("/api/postings").with(as("RECRUITER"))
                        .contentType(MediaType.APPLICATION_JSON).content(blankPosting))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Job title is required"));
    }
}
