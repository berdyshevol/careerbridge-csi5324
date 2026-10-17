
package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;

@Service
public class JobPostingExpirationProcessor {

    private final JobPostingRepository jobPostingRepository;

    public JobPostingExpirationProcessor(
            JobPostingRepository jobPostingRepository) {
        this.jobPostingRepository = jobPostingRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean expirePosting(Long postingId, Instant now) {
        JobPosting posting = jobPostingRepository.findById(postingId)
                .orElse(null);

        if (posting == null) {
            return false;
        }

        LocalDate deadline = posting.getApplicationDeadline();

        if (deadline == null || posting.getOrganization() == null) {
            return false;
        }

        Instant expirationTime = deadline.plusDays(1)
                .atStartOfDay(posting.getOrganization().getZoneId())
                .toInstant();

        if (now.isBefore(expirationTime)) {
            return false;
        }

        if (posting.getPostStatus() == PostStatus.PUBLISHED) {
            posting.setPostStatus(PostStatus.CLOSED);
            posting.setClosingReason("Expired");
            posting.setClosedAt(now);
            jobPostingRepository.saveAndFlush(posting);
            return true;
        }

        if (posting.getPostStatus() == PostStatus.PENDING_APPROVAL
                || posting.getPostStatus() == PostStatus.RETURNED) {
            posting.setPostStatus(PostStatus.EXPIRED);
            jobPostingRepository.saveAndFlush(posting);
        }

        return false;
    }
}
