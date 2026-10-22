package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

@Service
public class JobPostingExpirationService {

    private static final Logger log =
            LoggerFactory.getLogger(JobPostingExpirationService.class);

    private static final List<PostStatus> EXPIRABLE_STATUSES = List.of(
            PostStatus.PUBLISHED,
            PostStatus.PENDING_APPROVAL,
            PostStatus.RETURNED
    );

    private final JobPostingRepository jobPostingRepository;
    private final JobPostingExpirationProcessor processor;
    private final Clock clock;

    public JobPostingExpirationService(
            JobPostingRepository jobPostingRepository,
            JobPostingExpirationProcessor processor,
            Clock clock) {
        this.jobPostingRepository = jobPostingRepository;
        this.processor = processor;
        this.clock = clock;
    }

    public int runExpirationJob() {
        Instant now = clock.instant();
        int closedCount = 0;
        int errorCount = 0;

        // UTC+14 reaches each date first, so no deadline after its today can have passed anywhere;
        // the processor checks each survivor against its organization's own 23:59
        LocalDate latestExpiredDeadline =
                LocalDate.ofInstant(now, ZoneOffset.ofHours(14));

        List<JobPosting> postings = jobPostingRepository
                .findByPostStatusInAndApplicationDeadlineLessThanEqual(
                        EXPIRABLE_STATUSES,
                        latestExpiredDeadline
                );

        log.info("UC-13 expiration run started: time={}, postings={}",
                now, postings.size());

        for (JobPosting posting : postings) {
            if (!posting.isPastDeadline(now)) {
                continue;
            }
            try {
                if (processor.expirePosting(posting.getJobPostId(), now)) {
                    closedCount++;
                }
            } catch (Exception exception) {
                errorCount++;
                log.error(
                        "UC-13 failed to expire posting {}",
                        posting.getJobPostId(),
                        exception
                );
            }
        }

        log.info(
                "UC-13 expiration run finished: closed={}, errors={}",
                closedCount,
                errorCount
        );

        return closedCount;
    }
}
