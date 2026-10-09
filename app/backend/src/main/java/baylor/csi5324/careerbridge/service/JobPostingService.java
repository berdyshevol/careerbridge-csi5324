package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

@Service
public class JobPostingService {

    private final JobPostingRepository jobPostingRepository;

    public JobPostingService(JobPostingRepository jobPostingRepository) {
        this.jobPostingRepository = jobPostingRepository;
    }

    public List<JobPosting> searchPostings(String keyword) {
        List<JobPosting> openPostings = jobPostingRepository
                .findByPostStatusAndApplicationDeadlineGreaterThanEqualOrderByDatePostedDesc(
                        PostStatus.PUBLISHED, LocalDate.now());
        if (keyword == null || keyword.isBlank()) {
            return openPostings;
        }
        String needle = keyword.trim().toLowerCase(Locale.ROOT);
        return openPostings.stream()
                .filter(posting -> contains(posting.getTitle(), needle)
                        || contains(posting.getOrganization().getName(), needle)
                        || contains(posting.getLocation(), needle))
                .toList();
    }

    public JobPosting viewPosting(Long postingId) {
        return jobPostingRepository.findById(postingId)
                .filter(JobPosting::wasPublished)
                .orElseThrow(() -> new PostingNotFoundException(postingId));
    }

    private static boolean contains(String text, String needle) {
        return text != null && text.toLowerCase(Locale.ROOT).contains(needle);
    }
}
