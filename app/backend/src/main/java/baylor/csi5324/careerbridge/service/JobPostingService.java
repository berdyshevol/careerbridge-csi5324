
package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.dto.CreateJobPostingRequest;
import baylor.csi5324.careerbridge.dto.PostingSearchCriteria;
import baylor.csi5324.careerbridge.lifecycle.JobPostingLifecycle;
import baylor.csi5324.careerbridge.lifecycle.JobPostingLifecycle.Event;
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
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;

@Service
public class JobPostingService {

    static final String DEADLINE_PASSED = JobPostingLifecycle.DEADLINE_PASSED;
    public static final String CLOSED_BY_RECRUITER = JobPostingLifecycle.CLOSED_BY_RECRUITER;

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
        posting.setDatePosted(LocalDate.now());

        return jobPostingRepository.save(posting);
    }

    // One transaction, so the lazily loaded recruiter can be read
    @Transactional
    public JobPosting submitJobPosting(Long postingId, String recruiterEmail) {
        JobPosting posting = findOwnPosting(postingId, recruiterEmail, "submit");
        fire(JobPostingLifecycle.Move.of(posting, clock.instant()), Event.SUBMIT_JOB_POSTING);
        return jobPostingRepository.save(posting);
    }

    // UC-11 extensions 3b and 6a: a query, so it has no contract
    @Transactional(readOnly = true)
    public JobPosting openPostingForEdit(Long postingId, String recruiterEmail) {
        JobPosting posting = findOwnPosting(postingId, recruiterEmail, "change");
        check(JobPostingLifecycle.Move.of(posting, clock.instant()), Event.UPDATE_POSTING);
        return posting;
    }

    // CO-11.2: the organization stays, and a Returned posting keeps its comment until it is submitted again
    @Transactional
    public JobPosting updatePosting(Long postingId, CreateJobPostingRequest request, String recruiterEmail) {
        JobPosting posting = findOwnPosting(postingId, recruiterEmail, "change");
        check(JobPostingLifecycle.Move.of(posting, clock.instant()), Event.UPDATE_POSTING);
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
        JobPosting posting = findPostingForUpdate(postingId);

        if (!posting.wasCreatedBy(recruiterEmail)) {
            throw new PostingNotAllowedException("Only the recruiter who created this posting can close it");
        }
        requireActiveMember(recruiterEmail, posting.getOrganization());
        // Applications keep their stages (A3): only the posting changes
        fire(JobPostingLifecycle.Move.of(posting, clock.instant()), Event.CLOSE_POSTING);
        return jobPostingRepository.save(posting);
    }

    public List<JobPosting> openPostingApprovalQueue() {
        return jobPostingRepository.findByPostStatusOrderByDatePostedAscJobPostIdAsc(
                PostStatus.PENDING_APPROVAL);
    }

    @Transactional
    public JobPosting approveJobPosting(Long postingId, String administrator, String comment) {
        JobPosting posting = findPostingForUpdate(postingId);
        decide(posting, Event.APPROVE_JOB_POSTING, administrator, comment);
        return jobPostingRepository.save(posting);
    }

    @Transactional
    public JobPosting returnJobPosting(Long postingId, String administrator, String comment) {
        JobPosting posting = findPostingForUpdate(postingId);
        decide(posting, Event.RETURN_JOB_POSTING, administrator, comment);
        return jobPostingRepository.save(posting);
    }

    @Transactional
    public JobPosting rejectJobPosting(Long postingId, String administrator, String comment) {
        JobPosting posting = findPostingForUpdate(postingId);
        decide(posting, Event.REJECT_JOB_POSTING, administrator, comment);
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

    // UC-12 extension 6b, CO-12.1: a fact the approval rule needs but only a query can tell
    private boolean submitterStillActive(JobPosting posting) {
        Recruiter recruiter = posting.getRecruiter();
        return recruiter == null
                || recruiter.getAccountStatus() == AccountStatus.ACTIVE
                && recruiterOrganization.isActiveMember(recruiter.getEmail(), posting.getOrganization());
    }

    // Only the recruiter who created a posting changes, submits or closes it
    private JobPosting findOwnPosting(Long postingId, String recruiterEmail, String verb) {
        JobPosting posting = findPosting(postingId);
        if (!posting.wasCreatedBy(recruiterEmail)) {
            throw new PostingNotAllowedException("Only the recruiter who created this posting can " + verb + " it");
        }
        requireActiveMember(recruiterEmail, posting.getOrganization());
        return posting;
    }

    private JobPosting findPosting(Long postingId) {
        return jobPostingRepository.findById(postingId)
                .orElseThrow(() -> new PostingNotFoundException(postingId));
    }

    // A decision and a close lock the row, so an expiry run or a second Administrator waits instead of
    // overwriting the status this one sets
    private JobPosting findPostingForUpdate(Long postingId) {
        return jobPostingRepository.findByIdForUpdate(postingId)
                .orElseThrow(() -> new PostingNotFoundException(postingId));
    }

    private void decide(JobPosting posting, Event decision, String administrator, String comment) {
        fire(JobPostingLifecycle.Move.of(posting, clock.instant())
                .decidedBy(administrator, comment, submitterStillActive(posting)), decision);
    }

    private static void fire(JobPostingLifecycle.Move move, Event event) {
        check(move, event);
        JobPostingLifecycle.TABLE.fire(move, event);
    }

    // The lifecycle decides; this only picks the exception the controller turns into a response
    private static void check(JobPostingLifecycle.Move move, Event event) {
        JobPostingLifecycle.TABLE.refusal(move, event).ifPresent(refusal -> {
            if (JobPostingLifecycle.DEADLINE_WINDOW.equals(refusal.rule())
                    || JobPostingLifecycle.INVALID_COMMENT.equals(refusal.rule())) {
                throw new InvalidPostingException(refusal.message());
            }
            throw new PostingStateConflictException(refusal.message());
        });
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
