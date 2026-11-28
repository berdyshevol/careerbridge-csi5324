package baylor.csi5324.careerbridge.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.FetchType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

// Not mapped: approvalStatus, which repeats postStatus. postStatus changes only through the lifecycle
// methods below; the details stay settable while the posting is a draft (UC-11)
@Entity
@Table(name = "job_postings")
public class JobPosting {

    private static final LocalTime DEADLINE_TIME = LocalTime.of(23, 59);

    // The closing reasons of Close Job Posting (fig-04, A2)
    public static final String FILLED = "Filled";
    public static final String EXPIRED = "Expired";
    public static final String CLOSED_BY_RECRUITER = "Closed by recruiter";

    // UC-12, extension 6a
    public static final String DEADLINE_PASSED =
            "The application deadline passed while the posting was waiting. Set a new deadline and submit it again.";

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long jobPostId;

    @Column(nullable = false)
    private String title;

    @Column(length = 10000)
    private String description;

    @Column(length = 2000)
    private String jobRequirements;

    private String location;
    private String employmentType;
    private String salaryRange;
    private int numberOfOpenings = 1;
    private LocalDate datePosted;
    private LocalDate applicationDeadline;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PostStatus postStatus = PostStatus.DRAFT;

    @ManyToOne(optional = false)
    @JoinColumn(name = "organization_id")
    private Organization organization;

    // Null for the sample postings, which no recruiter created. Never sent: a User carries its password hash
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recruiter_id")
    private Recruiter recruiter;

    // They record whoever decided, also for a return or a rejection
    private String approvedBy;

    private LocalDateTime approvedAt;

    @Column(length = 2000)
    private String reviewComment;

    @Column(length = 50)
    private String closingReason;

    private Instant closedAt;

    public JobPosting() {
    }

    // UC-13 variation 2a: a deadline means 23:59 on that date in the organization's time zone
    public Instant closesAt() {
        return applicationDeadline == null
                ? null
                : applicationDeadline.atTime(DEADLINE_TIME).atZone(organization.getZoneId()).toInstant();
    }

    public boolean isPastDeadline(Instant now) {
        return applicationDeadline != null && !now.isBefore(closesAt());
    }

    public boolean isOpen(Instant now) {
        return postStatus == PostStatus.PUBLISHED
                && applicationDeadline != null
                && now.isBefore(closesAt());
    }

    // ---- Lifecycle (fig-04): one method per operation, every change asks PostStatus ----

    // CO-11.3. The deadline window is checked by the service, which owns "today" for the Recruiter
    public void submit() {
        moveTo(PostStatus.PENDING_APPROVAL, "Only a draft or a returned posting can be submitted; this one is "
                + postStatus.getLabel());
        approvedBy = null;
        approvedAt = null;
        reviewComment = null;
    }

    // CO-12.1. Past the deadline the posting goes back to the Recruiter instead (UC-12 ext 6a, fig-04
    // "return, or deadline passed"), so the answer says which of the two it became
    public PostStatus approve(String administrator, String comment, Instant now) {
        requirePendingApproval();
        if (!canBePublished(now)) {
            decide(PostStatus.RETURNED, administrator, DEADLINE_PASSED, now);
        } else {
            decide(PostStatus.PUBLISHED, administrator, comment, now);
            datePosted = LocalDate.ofInstant(now, organization.getZoneId());
        }
        return postStatus;
    }

    // The service checks the organization and the recruiter (UC-12 ext 6b) only when this is true
    public boolean canBePublished(Instant now) {
        return postStatus == PostStatus.PENDING_APPROVAL && applicationDeadline != null && !isPastDeadline(now);
    }

    // CO-12.2
    public void returnToRecruiter(String administrator, String comment, Instant now) {
        requirePendingApproval();
        decide(PostStatus.RETURNED, administrator, comment, now);
    }

    // CO-12.3
    public void reject(String administrator, String comment, Instant now) {
        requirePendingApproval();
        decide(PostStatus.REJECTED, administrator, comment, now);
    }

    // CO-13.2, UC-13 ext *a. Applications keep their stages (A3): only the posting changes
    public void closeByRecruiter(Instant now) {
        if (postStatus != PostStatus.PUBLISHED) {
            throw new PostingStateConflictException(
                    "Only a published posting can be closed; this one is " + postStatus.getLabel());
        }
        // Past its deadline the posting is UC-13's to close as Expired, at the next run
        if (isPastDeadline(now)) {
            throw new PostingStateConflictException(
                    "The application deadline has passed, so this posting is closing as Expired");
        }
        close(CLOSED_BY_RECRUITER, now);
    }

    public boolean isFilledBy(long hiredApplications) {
        return hiredApplications >= numberOfOpenings;
    }

    // Close Job Posting, UC-07 ext 6c (A2, A3, BR-10, BR-11). The caller loads the other active
    // applications, since an entity cannot query; the whole postcondition is then this one call
    public void fill(List<Application> otherActiveApplications, Instant now) {
        close(FILLED, now);
        for (Application other : otherActiveApplications) {
            if (other.getJobPosting() != this || !other.isActive()) {
                throw new IllegalArgumentException("Not an active application to this posting: "
                        + other.getApplicationId());
            }
            other.rejectBecausePostingClosed(now);
            // Notification hook: each of these is a Rejection notification (BR-11)
        }
    }

    public boolean isDueToExpire(Instant now) {
        return isPastDeadline(now)
                && (postStatus.canMoveTo(PostStatus.CLOSED) || postStatus.canMoveTo(PostStatus.EXPIRED));
    }

    // CO-13.1: a published posting closes as Expired; one never published is marked Expired (ext 2b)
    public PostStatus expire(Instant now) {
        if (!isDueToExpire(now)) {
            throw new IllegalStateException("Posting " + jobPostId + " is not due to expire");
        }
        if (postStatus == PostStatus.PUBLISHED) {
            close(EXPIRED, now);
        } else {
            moveTo(PostStatus.EXPIRED, null);
        }
        return postStatus;
    }

    // UC-12 ext 6c comes first: an Administrator who lost the race learns that, not what was wrong
    // with their comment
    public void requirePendingApproval() {
        if (postStatus != PostStatus.PENDING_APPROVAL) {
            throw new PostingStateConflictException(
                    "This posting was already decided: it is " + postStatus.getLabel());
        }
    }

    private void decide(PostStatus decision, String administrator, String comment, Instant now) {
        moveTo(decision, null);
        approvedBy = administrator;
        approvedAt = LocalDateTime.ofInstant(now, organization.getZoneId());
        reviewComment = comment == null || comment.isBlank() ? null : comment.trim();
    }

    // Close Job Posting: the three fields change together
    private void close(String reason, Instant now) {
        moveTo(PostStatus.CLOSED, null);
        closingReason = reason;
        closedAt = now;
    }

    private void moveTo(PostStatus next, String refusal) {
        if (!postStatus.canMoveTo(next)) {
            throw new PostingStateConflictException(refusal != null ? refusal
                    : "A posting that is " + postStatus.getLabel() + " cannot become " + next.getLabel());
        }
        postStatus = next;
    }

    public boolean wasPublished() {
        return postStatus == PostStatus.PUBLISHED || postStatus == PostStatus.CLOSED;
    }

    public Long getJobPostId() {
        return jobPostId;
    }

    public void setJobPostId(Long jobPostId) {
        this.jobPostId = jobPostId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getJobRequirements() {
        return jobRequirements;
    }

    public void setJobRequirements(String jobRequirements) {
        this.jobRequirements = jobRequirements;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getEmploymentType() {
        return employmentType;
    }

    public void setEmploymentType(String employmentType) {
        this.employmentType = employmentType;
    }

    public String getSalaryRange() {
        return salaryRange;
    }

    public void setSalaryRange(String salaryRange) {
        this.salaryRange = salaryRange;
    }

    public int getNumberOfOpenings() {
        return numberOfOpenings;
    }

    public void setNumberOfOpenings(int numberOfOpenings) {
        this.numberOfOpenings = numberOfOpenings;
    }

    public LocalDate getDatePosted() {
        return datePosted;
    }

    public void setDatePosted(LocalDate datePosted) {
        this.datePosted = datePosted;
    }

    public LocalDate getApplicationDeadline() {
        return applicationDeadline;
    }

    public void setApplicationDeadline(LocalDate applicationDeadline) {
        this.applicationDeadline = applicationDeadline;
    }

    public PostStatus getPostStatus() {
        return postStatus;
    }

    public Organization getOrganization() {
        return organization;
    }

    public void setOrganization(Organization organization) {
        this.organization = organization;
    }

    public Recruiter getRecruiter() {
        return recruiter;
    }

    public void setRecruiter(Recruiter recruiter) {
        this.recruiter = recruiter;
    }

    public boolean wasCreatedBy(String recruiterEmail) {
        return recruiter != null && recruiter.getEmail().equalsIgnoreCase(recruiterEmail);
    }

    public String getApprovedBy() {
        return approvedBy;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public String getReviewComment() {
        return reviewComment;
    }

    public String getClosingReason() {
        return closingReason;
    }

    public Instant getClosedAt() {
        return closedAt;
    }

}
