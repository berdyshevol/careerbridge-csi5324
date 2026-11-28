package baylor.csi5324.careerbridge.config;

import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.repository.ApplicantRepository;
import baylor.csi5324.careerbridge.repository.ApplicationRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

// Not @Transactional on purpose: the application starts the loader outside any transaction, and a
// test transaction would hide the lazy collections it walks (the Render crash of 2026-11-24)
@SpringBootTest
class SampleDataLoaderRestartTest {

    @Autowired
    private SampleDataLoader sampleDataLoader;

    @Autowired
    private ApplicantRepository applicantRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private TransactionTemplate transactionTemplate;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void aRestartOnADatabaseLoadedBeforeInterviewsExistedBackFillsThem() {
        Long applicationId = transactionTemplate.execute(status ->
                jordansApplicationAt(ApplicationStatus.INTERVIEW).getApplicationId());
        // The rows as an older start left them; the entity itself never lets stage and history part
        jdbcTemplate.update("DELETE FROM interviews WHERE application_id = ?", applicationId);
        jdbcTemplate.update("DELETE FROM application_status_history WHERE application_id = ? AND status_history_order > 0",
                applicationId);

        assertDoesNotThrow(() -> sampleDataLoader.run());

        transactionTemplate.executeWithoutResult(status -> {
            Application interviewed = applicationRepository.findById(applicationId).orElseThrow();
            assertFalse(interviewed.getInterviews().isEmpty());
            assertEquals(ApplicationStatus.INTERVIEW, interviewed.getStatusHistory()
                    .get(interviewed.getStatusHistory().size() - 1).getStatus());
        });
    }

    private Application jordansApplicationAt(ApplicationStatus stage) {
        return applicationRepository.findByApplicant(applicantRepository
                        .findByEmailIgnoreCase(SampleDataLoader.SAMPLE_APPLICANT_EMAIL).orElseThrow())
                .stream()
                .filter(application -> application.getApplicationStatus() == stage)
                .findFirst()
                .orElseThrow();
    }
}
