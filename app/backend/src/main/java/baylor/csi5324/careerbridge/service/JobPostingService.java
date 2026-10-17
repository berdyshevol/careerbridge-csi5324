
package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.dto.CreateJobPostingRequest;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
public class JobPostingService {

    // UC-11, extension 5b
    private static final int MIN_DAYS_TO_DEADLINE = 1;
    private static final int MAX_DAYS_TO_DEADLINE = 90;

    // UC-12, extension 6a
    static final String DEADLINE_PASSED =
            "The application deadline passed while the posting was waiting. Set a new deadline and submit it again.";

    private static final int MAX_COMMENT_LENGTH = 2000;

    private final JobPostingRepository jobPostingRepository;
    private final OrganizationRepository organizationRepository;

    public JobPostingService(
            JobPostingRepository jobPostingRepository,
            OrganizationRepository organizationRepository) {
        this.jobPostingRepository = jobPostingRepository;
        this.organizationRepository = organizationRepository;
    }

    public List<JobPosting> searchPostings(String keyword) {
        Instant now = Instant.now();

        // Get published postings first, then evaluate each organization's local deadline.
        List<JobPosting> publishedPostings = jobPostingRepository
                .findByPostStatusOrderByDatePostedAscJobPostIdAsc(PostStatus.PUBLISHED);

        String needle = keyword == null ? "" : keyword.trim().toLowerCase(Locale.ROOT);

        return publishedPostings.stream()
                .filter(posting -> posting.getApplicationDeadline() != null)
                .filter(posting -> posting.getOrganization() != null)
                .filter(posting -> now.isBefore(
                        posting.getApplicationDeadline().plusDays(1)
                                .atStartOfDay(posting.getOrganization().getZoneId())
                                .toInstant()))
                .filter(posting -> needle.isEmpty()
                        || contains(posting.getTitle(), needle)
                        || contains(posting.getOrganization().getName(), needle)
                        || contains(posting.getLocation(), needle))
                .sorted(Comparator
                        .comparing(JobPosting::getDatePosted,
                                Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(JobPosting::getJobPostId,
                                Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    public JobPosting viewPosting(Long postingId) {
        return jobPostingRepository.findById(postingId)
                .filter(JobPosting::wasPublished)
                .orElseThrow(() -> new PostingNotFoundException(postingId));
    }

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

    public JobPosting submitJobPosting(Long postingId) {
        JobPosting posting = findPosting(postingId);

        if (posting.getPostStatus() != PostStatus.DRAFT
                && posting.getPostStatus() != PostStatus.RETURNED) {
            throw new PostingStateConflictException(
                    "Only a draft or a returned posting can be submitted; this one is "
                            + posting.getPostStatus().getLabel());
        }

        LocalDate deadline = posting.getApplicationDeadline();
        LocalDate today = LocalDate.now();

        if (deadline == null
                || deadline.isBefore(today.plusDays(MIN_DAYS_TO_DEADLINE))
                || deadline.isAfter(today.plusDays(MAX_DAYS_TO_DEADLINE))) {
            throw new InvalidPostingException("The application deadline must be between "
                    + MIN_DAYS_TO_DEADLINE + " and " + MAX_DAYS_TO_DEADLINE + " days away");
        }

        posting.setPostStatus(PostStatus.PENDING_APPROVAL);
        posting.setApprovedBy(null);
        posting.setApprovedAt(null);
        posting.setReviewComment(null);
        return jobPostingRepository.save(posting);
    }

    public List<JobPosting> openPostingApprovalQueue() {
        return jobPostingRepository.findByPostStatusOrderByDatePostedAscJobPostIdAsc(
                PostStatus.PENDING_APPROVAL);
    }

    @Transactional
    public JobPosting approveJobPosting(Long postingId, String administrator, String comment) {
        JobPosting posting = findPendingPosting(postingId);

        if (posting.getApplicationDeadline() == null
                || posting.getApplicationDeadline().isBefore(LocalDate.now())) {
            recordDecision(posting, PostStatus.RETURNED, administrator, DEADLINE_PASSED);
        } else {
            recordDecision(posting, PostStatus.PUBLISHED, administrator, comment);
            posting.setDatePosted(LocalDate.now());
        }

        return jobPostingRepository.save(posting);
    }

    @Transactional
    public JobPosting returnJobPosting(Long postingId, String administrator, String comment) {
        JobPosting posting = findPendingPosting(postingId);
        recordDecision(posting, PostStatus.RETURNED, administrator, requireComment(comment));
        return jobPostingRepository.save(posting);
    }

    @Transactional
    public JobPosting rejectJobPosting(Long postingId, String administrator, String comment) {
        JobPosting posting = findPendingPosting(postingId);
        recordDecision(posting, PostStatus.REJECTED, administrator, requireComment(comment));
        return jobPostingRepository.save(posting);
    }

    private JobPosting findPosting(Long postingId) {
        return jobPostingRepository.findById(postingId)
                .orElseThrow(() -> new PostingNotFoundException(postingId));
    }

    private JobPosting findPendingPosting(Long postingId) {
        JobPosting posting = findPosting(postingId);

        if (posting.getPostStatus() != PostStatus.PENDING_APPROVAL) {
            throw new PostingStateConflictException(
                    "This posting was already decided: it is " + posting.getPostStatus().getLabel());
        }

        return posting;
    }

    private static void recordDecision(
            JobPosting posting, PostStatus decision, String administrator, String comment) {
        if (comment != null && comment.length() > MAX_COMMENT_LENGTH) {
            throw new InvalidPostingException("The comment is too long");
        }

        posting.setPostStatus(decision);
        posting.setApprovedBy(administrator);
        posting.setApprovedAt(LocalDateTime.now());
        posting.setReviewComment(comment == null || comment.isBlank() ? null : comment.trim());
    }

    private static String requireComment(String comment) {
        if (comment == null || comment.isBlank()) {
            throw new InvalidPostingException(
                    "A reason is required to return or reject a posting");
        }

        return comment;
    }

    // Longer text does not fit its column, and the database would answer with a server error
    private static void requireShortText(String text, String fieldName) {
        if (text != null && text.length() > 255) {
            throw new InvalidPostingException(fieldName + " is too long");
        }
    }

    private static boolean contains(String text, String needle) {
        return text != null && text.toLowerCase(Locale.ROOT).contains(needle);
    }
}
