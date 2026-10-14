package baylor.csi5324.careerbridge.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "careerbridge.public-deployment=true",
        "careerbridge.admin.password="})
class PublicDeploymentTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void savesNothingAndSaysWhy() throws Exception {
        // Not even valid JSON: the answer must not depend on what was sent
        mockMvc.perform(post("/api/postings").contentType(MediaType.APPLICATION_JSON).content("{"))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_PLAIN))
                .andExpect(content().string(ReadOnlyWithoutLogin.REASON));
    }

    @Test
    void hasNoAdministrator() throws Exception {
        mockMvc.perform(get("/api/admin/postings/pending").with(httpBasic("admin", "admin")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void stillShowsPostings() throws Exception {
        mockMvc.perform(get("/api/postings")).andExpect(status().isOk());
    }
}
