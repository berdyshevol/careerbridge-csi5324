package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.lifecycle.JobPostingLifecycle;
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
        JobPosting posting = jobPostingRepository.findByIdForUpdate(postingId).orElse(null);

        if (posting == null || !posting.isPastDeadline(now)) {
            return false;
        }

        // fig-04 decides where an expired posting goes: Published -> Closed, Pending/Returned -> Expired
        JobPostingLifecycle.Move move = JobPostingLifecycle.Move.of(posting, now);
        if (JobPostingLifecycle.TABLE.refusal(move, JobPostingLifecycle.Event.EXPIRE_POSTING).isPresent()) {
            return false;
        }
        PostStatus reached = JobPostingLifecycle.TABLE.fire(move, JobPostingLifecycle.Event.EXPIRE_POSTING);
        jobPostingRepository.saveAndFlush(posting);
        return reached == PostStatus.CLOSED;
    }
}
