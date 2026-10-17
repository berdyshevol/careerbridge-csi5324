
package baylor.csi5324.careerbridge.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(
        name = "careerbridge.public-deployment",
        havingValue = "false",
        matchIfMissing = true
)
public class JobPostingExpirationScheduler {

    private static final Logger log =
            LoggerFactory.getLogger(JobPostingExpirationScheduler.class);

    private final JobPostingExpirationService expirationService;

    public JobPostingExpirationScheduler(
            JobPostingExpirationService expirationService) {
        this.expirationService = expirationService;
    }

    @Scheduled(fixedRate = 900000)
    public void runScheduledExpiration() {
        long start = System.currentTimeMillis();

        try {
            int closed = expirationService.runExpirationJob();

            log.info(
                    "UC-13 expiration run completed: closed={}, durationMs={}",
                    closed,
                    System.currentTimeMillis() - start
            );
        } catch (Exception exception) {
            log.error("UC-13 expiration run failed", exception);
        }
    }
}
