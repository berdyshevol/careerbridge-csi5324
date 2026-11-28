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

    // One transaction per posting, so a failure leaves the rest of the run untouched (UC-13 extension 3a).
    // The row lock makes an offer acceptance that fills the posting finish first, so Expired never
    // overwrites Filled. Answers whether a published posting was closed
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean expirePosting(Long postingId, Instant now) {
        JobPosting posting = jobPostingRepository.findByIdForUpdate(postingId).orElse(null);

        if (posting == null || !posting.isDueToExpire(now)) {
            return false;
        }
        PostStatus result = posting.expire(now);
        jobPostingRepository.saveAndFlush(posting);
        return result == PostStatus.CLOSED;
    }
}
