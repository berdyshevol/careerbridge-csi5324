package baylor.csi5324.careerbridge.config;

import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.repository.ApplicantRepository;
import baylor.csi5324.careerbridge.repository.ApplicationRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.support.TransactionTemplate;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
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

    @Test
    void aRestartOnADatabaseLoadedBeforeInterviewsExistedBackFillsThem() {
        Long applicationId = transactionTemplate.execute(status -> {
            Application interviewed = jordansApplicationAt(ApplicationStatus.INTERVIEW);
            interviewed.getInterviews().clear();
            interviewed.getStatusHistory().subList(1, interviewed.getStatusHistory().size()).clear();
            return interviewed.getApplicationId();
        });

        assertDoesNotThrow(() -> sampleDataLoader.run());

        transactionTemplate.executeWithoutResult(status -> {
            Application interviewed = applicationRepository.findById(applicationId).orElseThrow();
            assertFalse(interviewed.getInterviews().isEmpty());
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
