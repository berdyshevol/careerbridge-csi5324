package baylor.csi5324.careerbridge.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class RegistrationControllerTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    private static String body(String fullName, String email, String password) {
        return "{\"fullName\": \"" + fullName + "\", \"email\": \"" + email + "\", \"password\": \"" + password + "\"}";
    }

    @Test
    void aVisitorRegistersAndGetsATokenAsAnApplicant() throws Exception {
        mockMvc.perform(post("/api/applicants").contentType(MediaType.APPLICATION_JSON)
                        .content(body("Pat Kim", "pat-" + System.nanoTime() + "@example.com", "Sunrise-2026x")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user.role").value("APPLICANT"))
                .andExpect(jsonPath("$.user.firstName").value("Pat"))
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist());
    }

    @Test
    void invalidFieldsComeBackFieldByField() throws Exception {
        mockMvc.perform(post("/api/applicants").contentType(MediaType.APPLICATION_JSON)
                        .content(body("Pat", "pat@example.com", "short")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fullName").value("Enter your first and last name."))
                .andExpect(jsonPath("$.password").exists())
                .andExpect(jsonPath("$.email").doesNotExist());
    }

    @Test
    void anEmailAlreadyRegisteredIsAConflictInPlainText() throws Exception {
        mockMvc.perform(post("/api/applicants").contentType(MediaType.APPLICATION_JSON)
                        .content(body("Sam Rivera", "sam.rivera@example.com", "Sunrise-2026x")))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_PLAIN))
                .andExpect(content().string("An account already exists for this email address. Log in instead."));
    }
}
