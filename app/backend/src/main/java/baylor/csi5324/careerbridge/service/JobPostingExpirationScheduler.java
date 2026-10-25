package baylor.csi5324.careerbridge.service;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

// Runs on the public site too: the role checks of ADR-0010 guard requests, not the system's own timed job
@Component
public class JobPostingExpirationScheduler {

    private final JobPostingExpirationService expirationService;

    public JobPostingExpirationScheduler(JobPostingExpirationService expirationService) {
        this.expirationService = expirationService;
    }

    // FR-UC13.1: at least every 15 minutes. The first run waits for the ready event, since a
    // scheduled run at startup would come before the sample data is loaded and find nothing.
    @EventListener(ApplicationReadyEvent.class)
    @Scheduled(initialDelay = 15, fixedRate = 15, timeUnit = TimeUnit.MINUTES)
    public void runScheduledExpiration() {
        expirationService.runExpirationJob();
    }
}
