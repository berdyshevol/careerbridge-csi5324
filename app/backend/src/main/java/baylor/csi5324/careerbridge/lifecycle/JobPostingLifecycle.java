package baylor.csi5324.careerbridge.lifecycle;

import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.PostStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

import static baylor.csi5324.careerbridge.model.PostStatus.CLOSED;
import static baylor.csi5324.careerbridge.model.PostStatus.DRAFT;
import static baylor.csi5324.careerbridge.model.PostStatus.EXPIRED;
import static baylor.csi5324.careerbridge.model.PostStatus.PENDING_APPROVAL;
import static baylor.csi5324.careerbridge.model.PostStatus.PUBLISHED;
import static baylor.csi5324.careerbridge.model.PostStatus.REJECTED;
import static baylor.csi5324.careerbridge.model.PostStatus.RETURNED;

// The posting lifecycle of BR-9, BR-10 and A9, spec/diagrams/fig-04, with the operations of
// CO-11.x, CO-12.x and CO-13.x as events
public final class JobPostingLifecycle {

    public enum Event {
        CREATE_POSTING, UPDATE_POSTING, SUBMIT_JOB_POSTING, APPROVE_JOB_POSTING, RETURN_JOB_POSTING,
        REJECT_JOB_POSTING, CLOSE_POSTING, FILL_POSTING, EXPIRE_POSTING
    }

    // UC-11, extension 5b
    public static final int MIN_DAYS_TO_DEADLINE = 1;
    public static final int MAX_DAYS_TO_DEADLINE = 90;
    public static final String DEADLINE_WINDOW = "deadline window";

    // UC-12: a refusal of the Administrator's comment is invalid input, not a conflict
    public static final String INVALID_COMMENT = "invalid comment";
    static final int MAX_COMMENT_LENGTH = 2000;

    // UC-12, extension 6a
    public static final String DEADLINE_PASSED =
            "The application deadline passed while the posting was waiting. Set a new deadline and submit it again.";

    // The reasons Close Job Posting records (UC-13, UC-07 extension 6c)
    public static final String CLOSED_BY_RECRUITER = "Closed by recruiter";
    public static final String FILLED = "Filled";
    public static final String EXPIRED_REASON = "Expired";

    public static final StateMachine<PostStatus, Event, Move> TABLE =
            new StateMachine<PostStatus, Event, Move>(PostStatus.class,
                    m -> m.posting().getPostStatus(), (m, status) -> m.posting().enterStatus(status))

            // Drawn from [*]: a new posting starts as a Draft; creating and submitting in one step is not built
            .from().on(Event.CREATE_POSTING).to(DRAFT).end()
            .from().on(Event.SUBMIT_JOB_POSTING).to(PENDING_APPROVAL).end()

            // CO-11.2: the Administrator does not have it yet, so the recruiter may still change it
            .from(DRAFT).on(Event.UPDATE_POSTING).to(DRAFT).end()
            .from(RETURNED).on(Event.UPDATE_POSTING).to(RETURNED).end()

            .from(DRAFT, RETURNED).on(Event.SUBMIT_JOB_POSTING).to(PENDING_APPROVAL)
                    .refuseIf(DEADLINE_WINDOW, m -> !m.deadlineInWindow(), m -> "The application deadline must be between "
                            + MIN_DAYS_TO_DEADLINE + " and " + MAX_DAYS_TO_DEADLINE + " days away")
                    .then(m -> m.posting().recordDecision(null, null, null))

            // CO-12.1: approving after the deadline sends it back instead (UC-12 extension 6a)
            .from(PENDING_APPROVAL).on(Event.APPROVE_JOB_POSTING).to(RETURNED).when(Move::deadlinePassed)
                    .then(m -> m.posting().recordDecision(m.decidedBy(), m.decidedAt(), DEADLINE_PASSED))
            .from(PENDING_APPROVAL).on(Event.APPROVE_JOB_POSTING).to(PUBLISHED)
                    .refuseIf("organization inactive", m -> !m.posting().getOrganization().isRegistered(),
                            m -> m.posting().getOrganization().getName()
                                    + " is no longer active, so the posting stays pending")
                    .refuseIf("recruiter inactive", m -> !m.submitterStillActive(),
                            m -> "The recruiter who submitted it is no longer an active member of "
                                    + m.posting().getOrganization().getName() + ", so the posting stays pending")
                    .refuseIf(INVALID_COMMENT, Move::commentTooLong, m -> "The comment is too long")
                    .then(m -> {
                        m.posting().recordDecision(m.decidedBy(), m.decidedAt(), m.comment());
                        m.posting().setDatePosted(m.decidedAt().toLocalDate());
                    })
            .from(PENDING_APPROVAL).on(Event.RETURN_JOB_POSTING).to(RETURNED)
                    .refuseIf(INVALID_COMMENT, m -> m.comment() == null,
                            m -> "A reason is required to return or reject a posting")
                    .refuseIf(INVALID_COMMENT, Move::commentTooLong, m -> "The comment is too long")
                    .then(m -> m.posting().recordDecision(m.decidedBy(), m.decidedAt(), m.comment()))
            .from(PENDING_APPROVAL).on(Event.REJECT_JOB_POSTING).to(REJECTED)
                    .refuseIf(INVALID_COMMENT, m -> m.comment() == null,
                            m -> "A reason is required to return or reject a posting")
                    .refuseIf(INVALID_COMMENT, Move::commentTooLong, m -> "The comment is too long")
                    .then(m -> m.posting().recordDecision(m.decidedBy(), m.decidedAt(), m.comment()))

            // Published -> Closed, "filled or expired" in fig-04, and early by the recruiter (UC-13 extension *a)
            .from(PUBLISHED).on(Event.CLOSE_POSTING).to(CLOSED)
                    // Past its deadline the posting is UC-13's to close as Expired, at the next run
                    .refuseIf("deadline passed", Move::deadlinePassed,
                            m -> "The application deadline has passed, so this posting is closing as Expired")
                    .then(m -> m.posting().recordClosing(CLOSED_BY_RECRUITER, m.now()))
            .from(PUBLISHED).on(Event.FILL_POSTING).to(CLOSED)
                    .then(m -> m.posting().recordClosing(FILLED, m.now()))
            .from(PUBLISHED).on(Event.EXPIRE_POSTING).to(CLOSED)
                    .refuseIf("deadline ahead", m -> !m.deadlinePassed(), m -> "The deadline has not passed")
                    .then(m -> m.posting().recordClosing(EXPIRED_REASON, m.now()))
            // UC-13 extension 2b: never published, so Expired rather than Closed
            .from(PENDING_APPROVAL, RETURNED).on(Event.EXPIRE_POSTING).to(EXPIRED)
                    .refuseIf("deadline ahead", m -> !m.deadlinePassed(), m -> "The deadline has not passed").end()

            .whenNotAllowed(Event.UPDATE_POSTING, m -> "Only a draft or a returned posting can be changed; this one is "
                    + m.posting().getPostStatus().getLabel())
            .whenNotAllowed(Event.SUBMIT_JOB_POSTING, m -> "Only a draft or a returned posting can be submitted; "
                    + "this one is " + m.posting().getPostStatus().getLabel())
            .whenNotAllowed(Event.APPROVE_JOB_POSTING, Move::alreadyDecided)
            .whenNotAllowed(Event.RETURN_JOB_POSTING, Move::alreadyDecided)
            .whenNotAllowed(Event.REJECT_JOB_POSTING, Move::alreadyDecided)
            .whenNotAllowed(Event.CLOSE_POSTING, m -> "Only a published posting can be closed; this one is "
                    + m.posting().getPostStatus().getLabel());

    private JobPostingLifecycle() {
    }

    // submitterStillActive needs a membership query, so the service works it out and passes it in
    public record Move(JobPosting posting, Instant now, String decidedBy, String comment,
                       boolean submitterStillActive) {

        public static Move of(JobPosting posting, Instant now) {
            return new Move(posting, now, null, null, true);
        }

        public Move decidedBy(String administrator, String reviewComment, boolean submitterActive) {
            String trimmed = reviewComment == null || reviewComment.isBlank() ? null : reviewComment.trim();
            return new Move(posting, now, administrator, trimmed, submitterActive);
        }

        boolean commentTooLong() {
            return comment != null && comment.length() > MAX_COMMENT_LENGTH;
        }

        boolean deadlinePassed() {
            return posting.getApplicationDeadline() == null || posting.isPastDeadline(now);
        }

        // The window is counted in the server's days, as before this table existed
        boolean deadlineInWindow() {
            LocalDate deadline = posting.getApplicationDeadline();
            LocalDate today = LocalDate.ofInstant(now, ZoneId.systemDefault());
            return deadline != null
                    && !deadline.isBefore(today.plusDays(MIN_DAYS_TO_DEADLINE))
                    && !deadline.isAfter(today.plusDays(MAX_DAYS_TO_DEADLINE));
        }

        LocalDateTime decidedAt() {
            return LocalDateTime.ofInstant(now, ZoneId.systemDefault());
        }

        String alreadyDecided() {
            return "This posting was already decided: it is " + posting.getPostStatus().getLabel();
        }
    }

    public static PostStatus fire(JobPosting posting, Instant now, Event event) {
        return TABLE.fire(Move.of(posting, now), event);
    }

    // Seed data and fixtures: walks fig-04 from Draft without rules or effects. Fire the last event for
    // real when the data needs who decided or why it closed.
    public static JobPosting restore(JobPosting posting, PostStatus status) {
        TABLE.restore(Move.of(posting, null), status);
        return posting;
    }
}
