
package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.dto.CreateJobPostingRequest;
import baylor.csi5324.careerbridge.dto.PostingSearchCriteria;
import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.model.Recruiter;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import baylor.csi5324.careerbridge.repository.RecruiterRepository;
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

    // UC-13 extension *a, the reason Close Job Posting records
    public static final String CLOSED_BY_RECRUITER = "Closed by recruiter";

    private static final ZoneOffset LATEST_ZONE = ZoneOffset.ofHours(-12);

    private final JobPostingRepository jobPostingRepository;
    private final OrganizationRepository organizationRepository;
    private final RecruiterRepository recruiterRepository;
    private final RecruiterOrganization recruiterOrganization;
    private final Clock clock;

    public JobPostingService(
            JobPostingRepository jobPostingRepository,
            OrganizationRepository organizationRepository,
            RecruiterRepository recruiterRepository,
            RecruiterOrganization recruiterOrganization,
            Clock clock) {
        this.jobPostingRepository = jobPostingRepository;
        this.organizationRepository = organizationRepository;
        this.recruiterRepository = recruiterRepository;
        this.recruiterOrganization = recruiterOrganization;
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

    public JobPosting createPosting(CreateJobPostingRequest request, String recruiterEmail) {
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

        validateDetails(request);

        Recruiter recruiter = recruiterOf(recruiterEmail);
        requireActiveMember(recruiterEmail, organization);

        JobPosting posting = new JobPosting();
        posting.setOrganization(organization);
        posting.setRecruiter(recruiter);
        applyDetails(posting, request);
        posting.setPostStatus(PostStatus.DRAFT);
        posting.setDatePosted(LocalDate.now());

        return jobPostingRepository.save(posting);
    }

    // One transaction, so the lazily loaded recruiter can be read
    @Transactional
    public JobPosting submitJobPosting(Long postingId, String recruiterEmail) {
        JobPosting posting = findOwnDraftOrReturned(postingId, recruiterEmail, "submit", "submitted");

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

    // UC-11 extensions 3b and 6a: a query, so it has no contract
    @Transactional(readOnly = true)
    public JobPosting openPostingForEdit(Long postingId, String recruiterEmail) {
        return findOwnDraftOrReturned(postingId, recruiterEmail, "change", "changed");
    }

    // CO-11.2: the organization stays, and a Returned posting keeps its comment until it is submitted again
    @Transactional
    public JobPosting updatePosting(Long postingId, CreateJobPostingRequest request, String recruiterEmail) {
        JobPosting posting = findOwnDraftOrReturned(postingId, recruiterEmail, "change", "changed");
        if (request == null) {
            throw new InvalidPostingException("Posting details are required");
        }
        validateDetails(request);
        applyDetails(posting, request);
        return jobPostingRepository.save(posting);
    }

    // UC-13 extension *a, CO-13.2: the Recruiter who created a Published posting closes it early
    @Transactional
    public JobPosting closePosting(Long postingId, String recruiterEmail) {
        JobPosting posting = findPosting(postingId);

        if (!posting.wasCreatedBy(recruiterEmail)) {
            throw new PostingNotAllowedException("Only the recruiter who created this posting can close it");
        }
        requireActiveMember(recruiterEmail, posting.getOrganization());
        if (posting.getPostStatus() != PostStatus.PUBLISHED) {
            throw new PostingStateConflictException(
                    "Only a published posting can be closed; this one is " + posting.getPostStatus().getLabel());
        }
        Instant now = clock.instant();
        // Past its deadline the posting is UC-13's to close as Expired, at the next run
        if (posting.isPastDeadline(now)) {
            throw new PostingStateConflictException(
                    "The application deadline has passed, so this posting is closing as Expired");
        }

        // Applications keep their stages (A3): only the posting changes
        posting.close(CLOSED_BY_RECRUITER, now);
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
            requireStillActive(posting);
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

    private Recruiter recruiterOf(String email) {
        return recruiterRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new PostingNotAllowedException("Only a recruiter can create or submit a posting"));
    }

    // UC-11 extension *a, BR-14: only an Active member of the organization works on its postings
    private void requireActiveMember(String recruiterEmail, Organization organization) {
        if (!recruiterOrganization.isActiveMember(recruiterEmail, organization)) {
            throw new PostingNotAllowedException("You are not an active member of " + organization.getName());
        }
    }

    // UC-12 extension 6b, CO-12.1: nothing is published for an organization or a recruiter that is no
    // longer active; the posting stays pending
    private void requireStillActive(JobPosting posting) {
        Organization organization = posting.getOrganization();
        if (!organization.isRegistered()) {
            throw new PostingStateConflictException(
                    organization.getName() + " is no longer active, so the posting stays pending");
        }
        Recruiter recruiter = posting.getRecruiter();
        if (recruiter == null) {
            return;
        }
        if (recruiter.getAccountStatus() != AccountStatus.ACTIVE
                || !recruiterOrganization.isActiveMember(recruiter.getEmail(), organization)) {
            throw new PostingStateConflictException("The recruiter who submitted it is no longer an active member of "
                    + organization.getName() + ", so the posting stays pending");
        }
    }

    // Only the recruiter who created a posting changes or submits it, and only before the Administrator has it
    private JobPosting findOwnDraftOrReturned(Long postingId, String recruiterEmail, String verb, String done) {
        JobPosting posting = findPosting(postingId);
        if (!posting.wasCreatedBy(recruiterEmail)) {
            throw new PostingNotAllowedException("Only the recruiter who created this posting can " + verb + " it");
        }
        requireActiveMember(recruiterEmail, posting.getOrganization());
        if (posting.getPostStatus() != PostStatus.DRAFT && posting.getPostStatus() != PostStatus.RETURNED) {
            throw new PostingStateConflictException("Only a draft or a returned posting can be " + done
                    + "; this one is " + posting.getPostStatus().getLabel());
        }
        return posting;
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

    // UC-11 extensions 5a and 5b, the same for a new posting and a changed one
    private static void validateDetails(CreateJobPostingRequest request) {
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
    }

    private static void applyDetails(JobPosting posting, CreateJobPostingRequest request) {
        posting.setTitle(request.title().trim());
        posting.setDescription(request.description());
        posting.setJobRequirements(request.jobRequirements());
        posting.setLocation(request.location());
        posting.setEmploymentType(request.employmentType());
        posting.setSalaryRange(request.salaryRange());
        posting.setNumberOfOpenings(request.numberOfOpenings());
        posting.setApplicationDeadline(request.applicationDeadline());
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
