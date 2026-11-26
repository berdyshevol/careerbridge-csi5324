package baylor.csi5324.careerbridge.controller;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.UUID;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Each test registers its own applicant: changing a demo account's password would break the other tests
@SpringBootTest
class PasswordResetControllerTest {

    private static final String OLD_PASSWORD = "Old-password-1";
    private static final String NEW_PASSWORD = "New-password-2";

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    private String newApplicant() throws Exception {
        String email = "reset-" + UUID.randomUUID() + "@example.com";
        mockMvc.perform(post("/api/applicants").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\": \"Pat Reset\", \"email\": \"" + email + "\", \"password\": \"" + OLD_PASSWORD + "\"}"))
                .andExpect(status().isCreated());
        return email;
    }

    private String resetToken(String email) throws Exception {
        String body = mockMvc.perform(post("/api/auth/password-reset").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"" + email + "\"}"))
                .andExpect(status().isAccepted())
                .andReturn().getResponse().getContentAsString();
        String link = JsonPath.read(body, "$.resetLink");
        return link.substring(link.indexOf("token=") + "token=".length());
    }

    private ResultActions newPassword(String token, String password) throws Exception {
        return mockMvc.perform(post("/api/auth/password-reset/new-password").contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\": \"" + token + "\", \"password\": \"" + password + "\"}"));
    }

    private ResultActions logIn(String email, String password) throws Exception {
        return mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"" + email + "\", \"password\": \"" + password + "\"}"));
    }

    @Test
    void theLinkSetsANewPasswordAndTheOldOneStopsWorking() throws Exception {
        String email = newApplicant();

        newPassword(resetToken(email), NEW_PASSWORD).andExpect(status().isNoContent());

        logIn(email, NEW_PASSWORD).andExpect(status().isOk());
        logIn(email, OLD_PASSWORD).andExpect(status().isUnauthorized());
    }

    @Test
    void aLinkWorksOnlyOnce() throws Exception {
        String token = resetToken(newApplicant());
        newPassword(token, NEW_PASSWORD).andExpect(status().isNoContent());

        newPassword(token, "Another-password-3").andExpect(status().isNotFound())
                .andExpect(jsonPath("$.expired").value(false));
    }

    @Test
    void aNewerLinkReplacesTheEarlierOne() throws Exception {
        String email = newApplicant();
        String first = resetToken(email);
        resetToken(email);

        newPassword(first, NEW_PASSWORD).andExpect(status().isNotFound());
    }

    @Test
    void aWeakPasswordIsRefusedAndTheLinkStillWorks() throws Exception {
        String token = resetToken(newApplicant());

        newPassword(token, "short").andExpect(status().isBadRequest()).andExpect(jsonPath("$.password").exists());
        newPassword(token, NEW_PASSWORD).andExpect(status().isNoContent());
    }

    @Test
    void anUnknownEmailGetsTheSameAnswerWithoutALink() throws Exception {
        mockMvc.perform(post("/api/auth/password-reset").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"nobody-here@example.com\"}"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.resetLink").doesNotExist());
    }

    @Test
    void resettingUnlocksALockedAccount() throws Exception {
        String email = newApplicant();
        for (int i = 0; i < 5; i++) {
            logIn(email, "Wrong-password-9");
        }
        logIn(email, OLD_PASSWORD).andExpect(status().isUnauthorized());

        newPassword(resetToken(email), NEW_PASSWORD).andExpect(status().isNoContent());

        logIn(email, NEW_PASSWORD).andExpect(status().isOk());
    }
}
