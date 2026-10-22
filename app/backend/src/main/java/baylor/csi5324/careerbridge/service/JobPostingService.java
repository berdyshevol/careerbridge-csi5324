
package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.dto.CreateJobPostingRequest;
import baylor.csi5324.careerbridge.dto.PostingSearchCriteria;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
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

    private static final ZoneOffset LATEST_ZONE = ZoneOffset.ofHours(-12);

    private final JobPostingRepository jobPostingRepository;
    private final OrganizationRepository organizationRepository;
    private final Clock clock;

    public JobPostingService(
            JobPostingRepository jobPostingRepository,
            OrganizationRepository organizationRepository,
            Clock clock) {
        this.jobPostingRepository = jobPostingRepository;
        this.organizationRepository = organizationRepository;
        this.clock = clock;
    }

    public List<JobPosting> searchPostings(PostingSearchCriteria criteria) {
        String keyword = normalized(criteria.keyword());
        String location = normalized(criteria.location());
        String organization = normalized(criteria.organization());
        String employmentType = normalized(criteria.employmentType());

        Instant now = clock.instant();

        // UTC-12 is the last to leave each date, so an earlier deadline has passed everywhere;
        // the rows left are checked against their organization's own 23:59
        return jobPostingRepository
                .findByPostStatusAndApplicationDeadlineGreaterThanEqualOrderByDatePostedDescJobPostIdDesc(
                        PostStatus.PUBLISHED, LocalDate.ofInstant(now, LATEST_ZONE))
                .stream()
                .filter(posting -> posting.isOpen(now))
                .filter(posting -> keyword == null
                        || contains(posting.getTitle(), keyword)
                        || contains(posting.getDescription(), keyword)
                        || contains(posting.getJobRequirements(), keyword))
                .filter(posting -> location == null
                        || location.equals(normalized(posting.getLocation())))
                // Organizations are not a fixed list like locations, so a visitor types part of the name
                .filter(posting -> organization == null
                        || contains(posting.getOrganization().getName(), organization))
                .filter(posting -> employmentType == null
                        || employmentType.equals(normalized(posting.getEmploymentType())))
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

        if (posting.getApplicationDeadline() == null || posting.isPastDeadline(clock.instant())) {
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

    private static String normalized(String text) {
        return text == null || text.isBlank() ? null : text.trim().toLowerCase(Locale.ROOT);
    }
}
