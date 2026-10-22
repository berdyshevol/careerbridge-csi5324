package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class JobPostingExpirationProcessor {

    private final JobPostingRepository jobPostingRepository;

    public JobPostingExpirationProcessor(JobPostingRepository jobPostingRepository) {
        this.jobPostingRepository = jobPostingRepository;
    }

    // One transaction per posting, so a failure leaves the rest of the run untouched (UC-13 extension 3a)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean expirePosting(Long postingId, Instant now) {
        JobPosting posting = jobPostingRepository.findById(postingId).orElse(null);

        if (posting == null || !posting.isPastDeadline(now)) {
            return false;
        }

        return switch (posting.getPostStatus()) {
            case PUBLISHED -> {
                posting.setPostStatus(PostStatus.CLOSED);
                posting.setClosingReason("Expired");
                posting.setClosedAt(now);
                jobPostingRepository.saveAndFlush(posting);
                yield true;
            }
            // UC-13 extension 2b: never published, so it is marked Expired rather than Closed
            case PENDING_APPROVAL, RETURNED -> {
                posting.setPostStatus(PostStatus.EXPIRED);
                jobPostingRepository.saveAndFlush(posting);
                yield false;
            }
            default -> false;
        };
    }
}
