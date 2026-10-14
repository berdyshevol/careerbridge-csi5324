
package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.dto.CreateJobPostingRequest;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class JobPostingService {

    private final JobPostingRepository jobPostingRepository;
    private final OrganizationRepository organizationRepository;

    public JobPostingService(
            JobPostingRepository jobPostingRepository,
            OrganizationRepository organizationRepository) {
        this.jobPostingRepository = jobPostingRepository;
        this.organizationRepository = organizationRepository;
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

    // UC-11: Create a posting as a draft
    public JobPosting createPosting(CreateJobPostingRequest request) {
        if (request == null) {
            throw new InvalidPostingException("Posting details are required");
        }

        if (request.organizationId() == null) {
            throw new InvalidPostingException("Organization is required");
        }

        Organization organization = organizationRepository
                .findById(request.organizationId())
                .orElseThrow(() ->
                        new InvalidPostingException("Organization not found"));

        if (request.title() == null || request.title().isBlank()) {
            throw new InvalidPostingException("Job title is required");
        }

        if (request.title().trim().length() > 255) {
            throw new InvalidPostingException("Job title is too long");
        }

        if (request.description() != null
                && request.description().length() > 10000) {
            throw new InvalidPostingException("Description is too long");
        }

        if (request.jobRequirements() != null
                && request.jobRequirements().length() > 2000) {
            throw new InvalidPostingException("Job requirements are too long");
        }

        requireShortText(request.location(), "Location");
        requireShortText(request.employmentType(), "Employment type");
        requireShortText(request.salaryRange(), "Salary range");

        if (request.applicationDeadline() == null
                || request.applicationDeadline().isBefore(LocalDate.now())) {
            throw new InvalidPostingException(
                    "Application deadline must be today or later");
        }

        if (request.numberOfOpenings() < 1) {
            throw new InvalidPostingException(
                    "At least one opening is required");
        }

        JobPosting posting = new JobPosting();
        posting.setOrganization(organization);
        posting.setTitle(request.title().trim());
        posting.setDescription(request.description());
        posting.setJobRequirements(request.jobRequirements());
        posting.setLocation(request.location());
        posting.setEmploymentType(request.employmentType());
        posting.setSalaryRange(request.salaryRange());
        posting.setNumberOfOpenings(request.numberOfOpenings());
        posting.setApplicationDeadline(request.applicationDeadline());
        posting.setPostStatus(PostStatus.DRAFT);
        posting.setDatePosted(LocalDate.now());

        return jobPostingRepository.save(posting);
    }

    // UC-12: Submit a draft or returned posting for approval
    @Transactional
    public JobPosting submitForApproval(Long postingId) {
        JobPosting posting = findPosting(postingId);

        if (posting.getPostStatus() != PostStatus.DRAFT
                && posting.getPostStatus() != PostStatus.RETURNED) {
            throw new IllegalStateException(
                    "Only draft or returned postings can be submitted");
        }

        if (posting.getApplicationDeadline() == null
                || posting.getApplicationDeadline().isBefore(LocalDate.now())) {
            throw new IllegalStateException(
                    "The posting must have a valid future deadline");
        }

        posting.setPostStatus(PostStatus.PENDING_APPROVAL);
        posting.setReviewedBy(null);
        posting.setReviewedAt(null);
        posting.setReviewComment(null);

        return jobPostingRepository.save(posting);
    }

    // UC-12: List postings awaiting administrator review
    public List<JobPosting> getPendingPostings() {
        return jobPostingRepository.findAll().stream()
                .filter(posting ->
                        posting.getPostStatus() == PostStatus.PENDING_APPROVAL)
                .toList();
    }

    // UC-12: Approve and publish a posting
    @Transactional
    public JobPosting approvePosting(
            Long postingId, String reviewer, String comment) {

        JobPosting posting = findPendingPosting(postingId);

        if (posting.getApplicationDeadline() == null
                || posting.getApplicationDeadline().isBefore(LocalDate.now())) {
            throw new IllegalStateException(
                    "Cannot publish a posting with an expired deadline");
        }

        recordReview(posting, reviewer, comment);
        posting.setPostStatus(PostStatus.PUBLISHED);

        return jobPostingRepository.save(posting);
    }

    // UC-12: Return a posting so the recruiter can correct it
    @Transactional
    public JobPosting returnPosting(
            Long postingId, String reviewer, String comment) {

        JobPosting posting = findPendingPosting(postingId);
        requireComment(comment);

        recordReview(posting, reviewer, comment);
        posting.setPostStatus(PostStatus.RETURNED);

        return jobPostingRepository.save(posting);
    }

    // UC-12: Reject a posting
    @Transactional
    public JobPosting rejectPosting(
            Long postingId, String reviewer, String comment) {

        JobPosting posting = findPendingPosting(postingId);
        requireComment(comment);

        recordReview(posting, reviewer, comment);
        posting.setPostStatus(PostStatus.REJECTED);

        return jobPostingRepository.save(posting);
    }

    private JobPosting findPosting(Long postingId) {
        return jobPostingRepository.findById(postingId)
                .orElseThrow(() -> new PostingNotFoundException(postingId));
    }

    private JobPosting findPendingPosting(Long postingId) {
        JobPosting posting = findPosting(postingId);

        if (posting.getPostStatus() != PostStatus.PENDING_APPROVAL) {
            throw new IllegalStateException(
                    "Only pending postings can be reviewed");
        }

        return posting;
    }

    private void recordReview(
            JobPosting posting, String reviewer, String comment) {

        if (reviewer == null || reviewer.isBlank()) {
            throw new IllegalArgumentException("Reviewer is required");
        }

        if (comment != null && comment.length() > 2000) {
            throw new IllegalArgumentException("Review comment is too long");
        }

        posting.setReviewedBy(reviewer.trim());
        posting.setReviewedAt(LocalDateTime.now());
        posting.setReviewComment(
                comment == null ? null : comment.trim());
    }

    private void requireComment(String comment) {
        if (comment == null || comment.isBlank()) {
            throw new IllegalArgumentException(
                    "A reason is required for returning or rejecting a posting");
        }
    }

    // Preserve UC-11 database column-length validation
    private static void requireShortText(String text, String fieldName) {
        if (text != null && text.length() > 255) {
            throw new InvalidPostingException(fieldName + " is too long");
        }
    }

    private static boolean contains(String text, String needle) {
        return text != null
                && text.toLowerCase(Locale.ROOT).contains(needle);
    }
}
