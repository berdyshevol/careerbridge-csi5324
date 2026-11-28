package baylor.csi5324.careerbridge.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.OrderBy;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;

// One application per applicant and posting, withdrawn ones included (A5).
// The stage changes only through the operations below, one per system operation of the contracts;
// each asks ApplicationStatus (BR-8) and writes history in moveTo, so stage and history always agree
@Entity
@Table(name = "applications",
        uniqueConstraints = @UniqueConstraint(columnNames = {"applicant_id", "job_post_id"}))
public class Application {

    // A13
    static final int MAX_INTERVIEW_ROUNDS = 2;

    // A3: the reason Close Job Posting gives every other active application
    public static final String POSTING_CLOSED = "Posting closed";

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long applicationId;

    @ManyToOne(optional = false)
    @JoinColumn(name = "applicant_id")
    private Applicant applicant;

    @ManyToOne(optional = false)
    @JoinColumn(name = "job_post_id")
    private JobPosting jobPosting;

    @Column(nullable = false)
    private LocalDate dateApplied;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus applicationStatus = ApplicationStatus.APPLIED;

    private String rejectionReason;
    private Instant withdrawnAt;

    // A copy, not a link to the Resume: later changes to the resume must not reach it (A6)
    @Embedded
    private ResumeSnapshot resumeSnapshot;

    @ElementCollection
    @CollectionTable(name = "application_status_history",
            joinColumns = @JoinColumn(name = "application_id"))
    @OrderColumn
    private List<StatusHistoryEntry> statusHistory = new ArrayList<>();

    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("roundNumber ASC, scheduledTime ASC")
    private List<Interview> interviews = new ArrayList<>();

    @OneToOne(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true)
    private Offer offer;

    protected Application() {
    }

    // CO-04.2: every application starts at Applied
    public Application(Applicant applicant, JobPosting jobPosting, ResumeSnapshot resumeSnapshot,
                       LocalDate dateApplied) {
        this.applicant = applicant;
        this.jobPosting = jobPosting;
        this.resumeSnapshot = resumeSnapshot;
        this.dateApplied = dateApplied;
        statusHistory.add(new StatusHistoryEntry(ApplicationStatus.APPLIED, dateApplied));
    }

    // ---- Recruiter operations (UC-14, UC-15) ----

    // CO-14.2. seenStage is the stage the recruiter was shown: a move since then is refused (ext 6a)
    public void advance(ApplicationStatus seenStage, Instant now) {
        requireUnchangedSince(seenStage);
        refusalToAdvance().ifPresent(this::refuse);
        moveTo(applicationStatus.nextStage().orElseThrow(), now, null);
        // Notification hook: the service creates the Stage change notification after this returns
    }

    // CO-14.3: reason comes from the fixed list (A18); the comment goes to the history entry
    public void reject(ApplicationStatus seenStage, String reason, String comment, Instant now) {
        requireUnchangedSince(seenStage);
        refusalToReject().ifPresent(this::refuse);
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("A rejection reason is required.");
        }
        endWithRejection(reason, comment, now);
    }

    // CO-14.4, a newly arranged interview: only at the Interview stage, two rounds at most (A13)
    public Interview recordInterview(LocalDateTime scheduledTime, String format, String location) {
        refusalToRecordInterview().ifPresent(this::refuse);
        Interview interview = new Interview(this, interviews.size() + 1, scheduledTime, format, location);
        interviews.add(interview);
        return interview;
    }

    // CO-15.1: the only way into the Offer stage, so an application at Offer always has its Offer
    public Offer extendOffer(OfferTerms offerTerms, Instant now) {
        refusalToExtendOffer().ifPresent(this::refuse);
        offer = new Offer(this, today(now), offerTerms);
        moveTo(ApplicationStatus.OFFER, now, null);
        return offer;
    }

    // CO-15.2: not a stage change; the history records the revision under the Offer stage, so its
    // last entry still names the current stage
    public void reviseOffer(OfferTerms offerTerms, Instant now) {
        refusalToReviseOffer().ifPresent(this::refuse);
        offer.revise(offerTerms);
        record(ApplicationStatus.OFFER, now, "Offer revised (revision " + offer.getRevision() + ")");
    }

    // ---- Applicant operations (UC-06, UC-07) ----

    // CO-06.2
    public void withdraw(String reason, Instant now) {
        requireWithdrawable();
        withdrawnAt = now;
        moveTo(ApplicationStatus.WITHDRAWN, now, reason);
    }

    // CO-07.2. The posting's other applications are not this aggregate's to change: when this
    // acceptance fills the last opening, the service hands them to JobPosting.fill
    public void acceptOffer(int expectedRevision, long alreadyHired, Instant now) {
        requireAnswerableOffer(expectedRevision, now);
        if (jobPosting.isFilledBy(alreadyHired)) {
            refuse("All openings for this posting have already been filled.");
        }
        offer.accept(today(now));
        moveTo(ApplicationStatus.HIRED, now, null);
    }

    // CO-07.3
    public void declineOffer(int expectedRevision, String reason, Instant now) {
        requireAnswerableOffer(expectedRevision, now);
        offer.decline(today(now));
        moveTo(ApplicationStatus.OFFER_DECLINED, now, reason);
    }

    // Close Job Posting (A3, BR-11): not a recruiter's decision, so there is no stage to compare
    void rejectBecausePostingClosed(Instant now) {
        endWithRejection(POSTING_CLOSED, null, now);
    }

    // ---- Why an operation is refused; withdrawing and answering an offer also feed availableActions ----

    // CO-06.1 shows the warning only when CO-06.2 would be accepted
    public void requireWithdrawable() {
        refusalToWithdraw().ifPresent(this::refuse);
    }

    public Optional<String> refusalToWithdraw() {
        if (applicationStatus.canMoveTo(ApplicationStatus.WITHDRAWN)) {
            return Optional.empty();
        }
        if (applicationStatus == ApplicationStatus.OFFER) {
            return Optional.of("This application is at the Offer stage. Use Decline on the offer instead.");
        }
        return Optional.of("This application is already " + applicationStatus.getLabel()
                + " and can no longer be withdrawn.");
    }

    // Accept and Decline are refused for the same reasons, in this order (FR-UC07.2, 7.3)
    public Optional<String> refusalToAnswerOffer(Instant now) {
        if (applicationStatus != ApplicationStatus.OFFER || offer == null || !offer.isOpen()) {
            return Optional.of("This offer is no longer open. Current stage: " + applicationStatus.getLabel() + ".");
        }
        if (jobPosting.getPostStatus() == PostStatus.CLOSED) {
            return Optional.of("This posting is closed and the offer can no longer be answered.");
        }
        if (offer.isExpired(now, jobPosting.getOrganization().getZoneId())) {
            return Optional.of("The response deadline has passed. This offer can no longer be accepted.");
        }
        return Optional.empty();
    }

    private Optional<String> refusalToAdvance() {
        if (applicationStatus.nextStage().isPresent()) {
            return Optional.empty();
        }
        if (applicationStatus == ApplicationStatus.INTERVIEW) {
            return Optional.of("This application is at the Interview stage. Extend an offer or reject it instead.");
        }
        if (applicationStatus == ApplicationStatus.OFFER) {
            return Optional.of("This application is at the Offer stage and waits for the applicant's answer.");
        }
        return Optional.of("This application is already " + applicationStatus.getLabel()
                + " and can no longer be moved.");
    }

    private Optional<String> refusalToReject() {
        return applicationStatus.canMoveTo(ApplicationStatus.REJECTED)
                ? Optional.empty()
                : Optional.of("This application is already " + applicationStatus.getLabel()
                        + " and can no longer be rejected.");
    }

    private Optional<String> refusalToRecordInterview() {
        if (applicationStatus != ApplicationStatus.INTERVIEW) {
            return Optional.of("Interviews are arranged only at the Interview stage; this application is "
                    + applicationStatus.getLabel() + ".");
        }
        if (interviews.size() >= MAX_INTERVIEW_ROUNDS) {
            return Optional.of("This application already has " + MAX_INTERVIEW_ROUNDS + " interview rounds.");
        }
        return Optional.empty();
    }

    private Optional<String> refusalToExtendOffer() {
        if (!applicationStatus.canMoveTo(ApplicationStatus.OFFER)) {
            return Optional.of("An offer is extended only at the Interview stage; this application is "
                    + applicationStatus.getLabel() + ".");
        }
        return refusalBecausePostingFilled();
    }

    private Optional<String> refusalToReviseOffer() {
        if (applicationStatus != ApplicationStatus.OFFER || offer == null || !offer.isOpen()) {
            return Optional.of("This offer can no longer be revised. Current stage: "
                    + applicationStatus.getLabel() + ".");
        }
        return refusalBecausePostingFilled();
    }

    // The applicant's buttons (CO-05.2 output) are the operations that would not be refused
    public List<String> availableActions(Instant now) {
        List<String> actions = new ArrayList<>();
        if (refusalToWithdraw().isEmpty()) {
            actions.add("WITHDRAW");
        }
        if (refusalToAnswerOffer(now).isEmpty()) {
            actions.add("ACCEPT_OFFER");
            actions.add("DECLINE_OFFER");
        }
        return actions;
    }

    // ---- Legacy data ----

    // A row saved before stage histories existed has only its Applied entry. The sample loader fills
    // in the path fig-03 says the stage was reached by, so stage and history agree again
    public void backfillLegacyHistory(Function<ApplicationStatus, LocalDate> dateOfStage) {
        if (statusHistory.size() > 1 || !applicationStatus.isActive()) {
            return;
        }
        ApplicationStatus stage = ApplicationStatus.APPLIED;
        while (stage != applicationStatus) {
            stage = stage == ApplicationStatus.INTERVIEW ? ApplicationStatus.OFFER : stage.nextStage().orElseThrow();
            statusHistory.add(new StatusHistoryEntry(stage, dateOfStage.apply(stage)));
        }
    }

    public void backfillLegacyOffer(OfferTerms offerTerms, LocalDate dateExtended) {
        if (applicationStatus == ApplicationStatus.OFFER && offer == null) {
            offer = new Offer(this, dateExtended, offerTerms);
        }
    }

    // ---- The one place the stage changes ----

    private void moveTo(ApplicationStatus next, Instant now, String note) {
        if (!applicationStatus.canMoveTo(next)) {
            // Each operation refuses with a reason first; reaching this line is a programming error
            throw new IllegalStateException("BR-8: " + applicationStatus + " cannot move to " + next);
        }
        applicationStatus = next;
        record(next, now, note);
    }

    // The recruiter and the internal note of CO-14.2 would be added here, as two more columns of the entry
    private void record(ApplicationStatus stage, Instant now, String note) {
        statusHistory.add(new StatusHistoryEntry(stage, today(now), note));
    }

    private void endWithRejection(String reason, String comment, Instant now) {
        if (offer != null && offer.isOpen()) {
            offer.rescind();
        }
        rejectionReason = reason;
        moveTo(ApplicationStatus.REJECTED, now, comment);
    }

    private void requireAnswerableOffer(int expectedRevision, Instant now) {
        refusalToAnswerOffer(now).ifPresent(this::refuse);
        offer.requireRevision(expectedRevision, now, jobPosting.getOrganization().getZoneId());
    }

    private void requireUnchangedSince(ApplicationStatus seenStage) {
        if (seenStage != applicationStatus) {
            refuse("This application was moved since you opened it. Its stage is now "
                    + applicationStatus.getLabel() + ".");
        }
    }

    private Optional<String> refusalBecausePostingFilled() {
        return jobPosting.getPostStatus() == PostStatus.CLOSED
                ? Optional.of("This posting is closed, so no offer can be extended or changed.")
                : Optional.empty();
    }

    private void refuse(String reason) {
        throw new ApplicationActionRefusedException(applicationStatus, reason);
    }

    // History dates are the organization's calendar day (A14)
    private LocalDate today(Instant now) {
        return LocalDate.ofInstant(now, jobPosting.getOrganization().getZoneId());
    }

    // ---- Reads ----

    public Long getApplicationId() {
        return applicationId;
    }

    public Applicant getApplicant() {
        return applicant;
    }

    public JobPosting getJobPosting() {
        return jobPosting;
    }

    public LocalDate getDateApplied() {
        return dateApplied;
    }

    public ApplicationStatus getApplicationStatus() {
        return applicationStatus;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public ApplicationStatus getRejectedAtStage() {
        for (int i = statusHistory.size() - 1; i >= 0; i--) {
            if (statusHistory.get(i).getStatus() == ApplicationStatus.REJECTED) {
                return i > 0 ? statusHistory.get(i - 1).getStatus() : null;
            }
        }
        return null;
    }

    public LocalDate getRejectionDate() {
        for (int i = statusHistory.size() - 1; i >= 0; i--) {
            StatusHistoryEntry entry = statusHistory.get(i);
            if (entry.getStatus() == ApplicationStatus.REJECTED) {
                return entry.getDate();
            }
        }
        return null;
    }

    public List<Interview> getInterviews() {
        return Collections.unmodifiableList(interviews);
    }

    public Offer getOffer() {
        return offer;
    }

    public Instant getWithdrawnAt() {
        return withdrawnAt;
    }

    public ResumeSnapshot getResumeSnapshot() {
        return resumeSnapshot;
    }

    public List<StatusHistoryEntry> getStatusHistory() {
        return Collections.unmodifiableList(statusHistory);
    }

    public boolean isActive() {
        return applicationStatus.isActive();
    }

    public LocalDate getLastStageChangeDate() {
        if (statusHistory.isEmpty()) {
            return dateApplied;
        }
        return statusHistory.get(statusHistory.size() - 1).getDate();
    }
}
