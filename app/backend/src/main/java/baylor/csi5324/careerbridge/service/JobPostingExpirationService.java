
package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

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

    public JobPostingExpirationService(
            JobPostingRepository jobPostingRepository,
            JobPostingExpirationProcessor processor) {
        this.jobPostingRepository = jobPostingRepository;
        this.processor = processor;
    }

    public int runExpirationJob() {
        Instant now = Instant.now();
        int closedCount = 0;
        int errorCount = 0;

        // UTC+14 is the earliest timezone to enter a new calendar day.
        // This date is a safe upper bound for potentially expired deadlines.
        // The processor checks each organization's exact local midnight.
        LocalDate latestExpiredDeadline =
                LocalDate.ofInstant(now, ZoneOffset.ofHours(14)).minusDays(1);

        List<JobPosting> postings = jobPostingRepository
                .findByPostStatusInAndApplicationDeadlineLessThanEqual(
                        EXPIRABLE_STATUSES,
                        latestExpiredDeadline
                );

        log.info("UC-13 expiration run started: time={}, postings={}",
                now, postings.size());

        for (JobPosting posting : postings) {
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
