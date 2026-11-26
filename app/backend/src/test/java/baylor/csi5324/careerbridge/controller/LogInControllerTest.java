package baylor.csi5324.careerbridge.controller;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class LogInControllerTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void logInReturnsATokenThatOpensTheCurrentUser() throws Exception {
        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"riley.chen@example.com\", \"password\": \"Demo-test-1\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role").value("RECRUITER"))
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist())
                .andReturn().getResponse().getContentAsString();
        String token = JsonPath.read(body, "$.token");

        mockMvc.perform(get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("riley.chen@example.com"))
                .andExpect(jsonPath("$.firstName").value("Riley"));
    }

    @Test
    void theNumberedDemoAccountsLogInWithTheirSharedPassword() throws Exception {
        String[][] accounts = {
                {"applicant1@example.com", "APPLICANT"}, {"applicant2@example.com", "APPLICANT"},
                {"applicant3@example.com", "APPLICANT"}, {"recruiter1@example.com", "RECRUITER"},
                {"recruiter2@example.com", "RECRUITER"}, {"recruiter3@example.com", "RECRUITER"},
                {"recruiter4@example.com", "RECRUITER"}, {"recruiter5@example.com", "RECRUITER"},
                {"recruiter6@example.com", "RECRUITER"}};
        for (String[] account : accounts) {
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\": \"" + account[0] + "\", \"password\": \"Demo-test-1\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.user.role").value(account[1]));
        }
    }

    @Test
    void aWrongPasswordIsRefusedInPlainText() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"sam.rivera@example.com\", \"password\": \"nope\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_PLAIN))
                .andExpect(content().string("The email or password is not right. Check both and try again."));
    }

    @Test
    void anExpiredOrBrokenTokenStillReadsTheJobBoard() throws Exception {
        mockMvc.perform(get("/api/postings").header(HttpHeaders.AUTHORIZATION, "Bearer not-a-token"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/postings/999999").header(HttpHeaders.AUTHORIZATION, "Bearer not-a-token"))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/auth/login").header(HttpHeaders.AUTHORIZATION, "Bearer not-a-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"sam.rivera@example.com\", \"password\": \"Demo-test-1\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void theCurrentUserNeedsAValidToken() throws Exception {
        mockMvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, "Bearer not-a-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void theAdministratorsTokenOpensTheApprovalQueue() throws Exception {
        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"admin@careerbridge.example\", \"password\": \"Demo-test-1\"}"))
                .andReturn().getResponse().getContentAsString();
        String token = JsonPath.read(body, "$.token");

        mockMvc.perform(get("/api/admin/postings/pending").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void anApplicantsTokenDoesNotOpenTheApprovalQueue() throws Exception {
        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"sam.rivera@example.com\", \"password\": \"Demo-test-1\"}"))
                .andReturn().getResponse().getContentAsString();
        String token = JsonPath.read(body, "$.token");

        mockMvc.perform(get("/api/admin/postings/pending").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isForbidden());
    }
}
