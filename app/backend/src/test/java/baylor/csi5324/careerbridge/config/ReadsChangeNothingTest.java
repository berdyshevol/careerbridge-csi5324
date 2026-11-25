package baylor.csi5324.careerbridge.config;

import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Offer;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.model.ResumeSnapshot;
import baylor.csi5324.careerbridge.repository.ApplicantRepository;
import baylor.csi5324.careerbridge.repository.ApplicationRepository;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import baylor.csi5324.careerbridge.repository.RecruiterRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

// Reads need no role (BR-3, ADR-0010), so a read that writes would let anyone
// change data. Found by asking Spring for the endpoints, so a new
// one is checked without anyone remembering to add it here.
@SpringBootTest
// A demo account, so that /api/auth/me and the applicant's reads find their user; every role,
// so that no read is refused before it reaches the code that could write
@WithMockUser(username = "jordan.lee@example.com", roles = {"APPLICANT", "RECRUITER", "ADMINISTRATOR"})
class ReadsChangeNothingTest {

    private static final String RECRUITER = "riley.chen@example.com";

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private RequestMappingHandlerMapping handlerMapping;

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private JobPostingRepository jobPostingRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private ApplicantRepository applicantRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private RecruiterRepository recruiterRepository;

    @Test
    void everyReadUnderApiLeavesTheDatabaseAsItWas() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        // A posting and applications of their own: other tests share the database and may have removed the sample ones
        JobPosting posting = publishedPosting();
        JobPosting offerPosting = publishedPosting();
        String postingId = String.valueOf(posting.getJobPostId());
        String applicationId = String.valueOf(sampleApplication(posting).getApplicationId());
        String offerApplicationId = String.valueOf(sampleOfferApplication(offerPosting).getApplicationId());
        // Reopening a posting to edit it needs a Draft that the demo recruiter created (UC-11)
        JobPosting draft = publishedPosting();
        draft.setPostStatus(PostStatus.DRAFT);
        draft.setOrganization(organizationRepository.findByName("Waco Health Partners").orElseThrow());
        draft.setRecruiter(recruiterRepository.findByEmailIgnoreCase(RECRUITER).orElseThrow());
        String draftId = String.valueOf(jobPostingRepository.save(draft).getJobPostId());
        List<String> reads = handlerMapping.getHandlerMethods().keySet().stream()
                // A mapping without a method answers GET too
                .filter(info -> info.getMethodsCondition().getMethods().isEmpty()
                        || info.getMethodsCondition().getMethods().contains(RequestMethod.GET))
                .flatMap(info -> info.getPatternValues().stream())
                .filter(pattern -> pattern.startsWith("/api/"))
                .map(pattern -> pattern
                        .replace("{applicationId}", pattern.endsWith("/offer") ? offerApplicationId : applicationId)
                        .replaceAll("\\{[^}]+}", pattern.endsWith("/edit") ? draftId : postingId))
                .toList();
        assertFalse(reads.isEmpty());

        var before = everyTable();
        for (String read : reads) {
            // A refused read never reaches the code that could write
            var request = read.endsWith("/edit") ? get(read).with(user(RECRUITER).roles("RECRUITER")) : get(read);
            int status = mockMvc.perform(request).andReturn().getResponse().getStatus();
            assertTrue(status < 400, "GET " + read + " answered " + status
                    + ": give this test a request that reaches the handler");
            var after = everyTable();
            for (String table : before.keySet()) {
                assertEquals(before.get(table), after.get(table), "GET " + read + " changed " + table);
            }
            before = after;
        }
    }

    private Map<String, List<Map<String, Object>>> everyTable() {
        Map<String, List<Map<String, Object>>> tables = new HashMap<>();
        // PostgreSQL names the schema in lower case, H2 in upper case
        for (String table : jdbc.queryForList("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES "
                + "WHERE LOWER(TABLE_SCHEMA) = 'public' AND TABLE_TYPE = 'BASE TABLE'", String.class)) {
            List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM \"" + table + "\" ORDER BY 1");
            // A file's content compares by its bytes, as two reads give two arrays
            rows.forEach(row -> row.replaceAll((column, value) ->
                    value instanceof byte[] bytes ? HexFormat.of().formatHex(bytes) : value));
            tables.put(table, rows);
        }
        assertFalse(tables.isEmpty(), "found no tables to compare");
        return tables;
    }

    private JobPosting publishedPosting() {
        JobPosting posting = new JobPosting();
        posting.setOrganization(organizationRepository.save(new Organization("Reads Change Nothing " + System.nanoTime())));
        posting.setTitle("Read-only Engineer");
        posting.setNumberOfOpenings(1);
        posting.setDatePosted(LocalDate.now());
        posting.setApplicationDeadline(LocalDate.now().plusDays(30));
        posting.setPostStatus(PostStatus.PUBLISHED);
        return jobPostingRepository.save(posting);
    }

    private Application sampleApplication(JobPosting posting) {
        Applicant jordan = applicantRepository.findByEmailIgnoreCase(SampleDataLoader.SAMPLE_APPLICANT_EMAIL)
                .orElseThrow();
        return applicationRepository.save(new Application(
                jordan,
                posting,
                new ResumeSnapshot("read-only.pdf", "application/pdf", 1024L),
                LocalDate.now()));
    }

    private Application sampleOfferApplication(JobPosting posting) {
        Applicant jordan = applicantRepository.findByEmailIgnoreCase(SampleDataLoader.SAMPLE_APPLICANT_EMAIL)
                .orElseThrow();
        Application application = new Application(
                jordan,
                posting,
                new ResumeSnapshot("read-only.pdf", "application/pdf", 1024L),
                LocalDate.now());
        application.setApplicationStatus(ApplicationStatus.OFFER);
        application.setOffer(new Offer(
                application,
                LocalDate.now(),
                LocalDate.now().plusDays(30),
                "$65,000 USD per year",
                "Standard benefits.",
                LocalDate.now().plusDays(14),
                null));
        return applicationRepository.save(application);
    }
}
