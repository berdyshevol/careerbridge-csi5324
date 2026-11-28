package baylor.csi5324.careerbridge.lifecycle;

import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.Interview;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Offer;
import baylor.csi5324.careerbridge.model.OfferStatus;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.model.StatusHistoryEntry;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static java.util.function.Predicate.not;
import static baylor.csi5324.careerbridge.model.ApplicationStatus.APPLIED;
import static baylor.csi5324.careerbridge.model.ApplicationStatus.HIRED;
import static baylor.csi5324.careerbridge.model.ApplicationStatus.INTERVIEW;
import static baylor.csi5324.careerbridge.model.ApplicationStatus.OFFER;
import static baylor.csi5324.careerbridge.model.ApplicationStatus.OFFER_DECLINED;
import static baylor.csi5324.careerbridge.model.ApplicationStatus.REJECTED;
import static baylor.csi5324.careerbridge.model.ApplicationStatus.SCREENING;
import static baylor.csi5324.careerbridge.model.ApplicationStatus.WITHDRAWN;

// The application pipeline of BR-8, spec/diagrams/fig-03. One row per edge of the figure; the events are
// the system operations of the contracts (CO-06.2, CO-07.2, CO-07.3, CO-14.2-14.4, CO-15.1, CO-15.2).
public final class ApplicationLifecycle {

    public enum Event {
        SUBMIT_APPLICATION, ADVANCE_APPLICATION, REJECT_APPLICATION, RECORD_INTERVIEW, EXTEND_OFFER, REVISE_OFFER,
        WITHDRAW_APPLICATION, ACCEPT_OFFER, DECLINE_OFFER
    }

    // The names the applicant's screen already knows (ApplicationDetailResponse.availableActions)
    private static final List<Event> APPLICANT_EVENTS =
            List.of(Event.WITHDRAW_APPLICATION, Event.ACCEPT_OFFER, Event.DECLINE_OFFER);

    public static final String OFFER_REVISED = "offer revised";
    public static final String POSTING_CLOSED = "Posting closed";
    static final int MAX_INTERVIEW_ROUNDS = 2;

    public static final StateMachine<ApplicationStatus, Event, Move> TABLE =
            new StateMachine<ApplicationStatus, Event, Move>(ApplicationStatus.class,
                    m -> m.application().getApplicationStatus(),
                    (m, stage) -> m.application().enterStage(stage, m.date(), m.note()))

            // Drawn from [*]: the Application constructor starts at Applied with its first history entry (CO-04.2)
            .from().on(Event.SUBMIT_APPLICATION).to(APPLIED).end()

            // CO-14.2: one stage forward at a time; there is no advance out of Interview (FR-UC14.3)
            .from(APPLIED).on(Event.ADVANCE_APPLICATION).to(SCREENING)
                    .refuseIf("stage changed", Move::stageChanged, Move::stageChangedMessage).end()
            .from(SCREENING).on(Event.ADVANCE_APPLICATION).to(INTERVIEW)
                    .refuseIf("stage changed", Move::stageChanged, Move::stageChangedMessage).end()

            // CO-14.4: interview rounds are recorded at Interview only, at most two (A13); not a stage change
            .from(INTERVIEW).on(Event.RECORD_INTERVIEW).to(INTERVIEW)
                    .refuseIf("rounds", m -> lastRound(m) >= MAX_INTERVIEW_ROUNDS,
                            m -> "This application already has " + MAX_INTERVIEW_ROUNDS + " interview rounds.").end()

            // CO-15.1 and CO-15.2
            .from(INTERVIEW).on(Event.EXTEND_OFFER).to(OFFER)
                    .refuseIf("posting closed", Move::postingClosed,
                            m -> "This posting is closed, so no offer can be extended.")
                    .then(m -> m.application().setOffer(m.terms().newOffer(m.application(), m.date())))
            .from(OFFER).on(Event.REVISE_OFFER).to(OFFER)
                    .refuseIf("offer answered", not(Move::offerOpen),
                            m -> "This offer was already answered and can no longer be revised.")
                    .refuseIf("posting closed", Move::postingClosed,
                            m -> "This posting is closed, so the offer can no longer be revised.")
                    .then(m -> OfferLifecycle.TABLE.fire(
                            new OfferLifecycle.Move(m.offer(), m.date(), m.terms()), OfferLifecycle.Event.REVISE))

            // CO-14.3: from any active stage; an open offer is rescinded with it
            .from(APPLIED, SCREENING, INTERVIEW, OFFER).on(Event.REJECT_APPLICATION).to(REJECTED)
                    .refuseIf("stage changed", Move::stageChanged, Move::stageChangedMessage)
                    .then(m -> {
                        m.application().recordRejection(m.rejectionReason());
                        OfferLifecycle.rescindIfOpen(m.offer(), m.date());
                    })

            // CO-06.2: not from Offer, where the applicant declines instead
            .from(APPLIED, SCREENING, INTERVIEW).on(Event.WITHDRAW_APPLICATION).to(WITHDRAWN)
                    .then(m -> m.application().recordWithdrawal(m.now()))

            // CO-07.2 and CO-07.3; the rule order is the order of the refusals in UC-07's extensions
            .from(OFFER).on(Event.ACCEPT_OFFER).to(HIRED)
                    .refuseIf("offer answered", not(Move::offerOpen), Move::offerNotOpenMessage)
                    .refuseIf("posting closed", Move::postingClosed,
                            m -> "This posting is closed and the offer can no longer be answered.")
                    .refuseIf("offer expired", Move::offerExpired,
                            m -> "The response deadline has passed. This offer can no longer be accepted.")
                    .refuseIf(OFFER_REVISED, Move::revisionChanged, m -> "This offer was revised.")
                    .refuseIf("openings filled", m -> m.hiredBefore() >= m.posting().getNumberOfOpenings(),
                            m -> "All openings for this posting have already been filled.")
                    .then(m -> OfferLifecycle.fire(m.offer(), m.date(), OfferLifecycle.Event.ACCEPT))
            .from(OFFER).on(Event.DECLINE_OFFER).to(OFFER_DECLINED)
                    .refuseIf("offer answered", not(Move::offerOpen), Move::offerNotOpenMessage)
                    .refuseIf("posting closed", Move::postingClosed,
                            m -> "This posting is closed and the offer can no longer be answered.")
                    .refuseIf("offer expired", Move::offerExpired,
                            m -> "The response deadline has passed. This offer can no longer be accepted.")
                    .refuseIf(OFFER_REVISED, Move::revisionChanged, m -> "This offer was revised.")
                    .then(m -> OfferLifecycle.fire(m.offer(), m.date(), OfferLifecycle.Event.DECLINE))

            .whenNotAllowed(Event.WITHDRAW_APPLICATION, m -> m.stage() == OFFER
                    ? "This application is at the Offer stage. Use Decline on the offer instead."
                    : "This application is already " + m.stage().getLabel() + " and can no longer be withdrawn.")
            .whenNotAllowed(Event.ACCEPT_OFFER, Move::offerNotOpenMessage)
            .whenNotAllowed(Event.DECLINE_OFFER, Move::offerNotOpenMessage)
            // FR-UC14.5
            .whenNotAllowed(Event.ADVANCE_APPLICATION, m -> "An application at " + m.stage().getLabel()
                    + " cannot be advanced: the pipeline is fixed and stage changes are final.")
            .whenNotAllowed(Event.REJECT_APPLICATION, m -> "This application is already "
                    + m.stage().getLabel() + " and can no longer be rejected.")
            .whenNotAllowed(Event.RECORD_INTERVIEW, m -> "Interviews are recorded only at the Interview stage; "
                    + "this application is at " + m.stage().getLabel() + ".")
            .whenNotAllowed(Event.EXTEND_OFFER, m -> "An offer is extended only at the Interview stage; "
                    + "this application is at " + m.stage().getLabel() + ".")
            .whenNotAllowed(Event.REVISE_OFFER, m -> "This offer is no longer open, so it can no longer be revised. "
                    + "Current stage: " + m.stage().getLabel() + ".");

    private ApplicationLifecycle() {
    }

    // Everything a rule or an effect may look at. Facts that need a query (hiredBefore) come from the service.
    public record Move(Application application, Instant now, String note, String rejectionReason,
                       Integer expectedRevision, long hiredBefore, ApplicationStatus expectedStage,
                       OfferTerms terms) {

        public static Move of(Application application, Instant now) {
            return new Move(application, now, null, null, null, 0, null, null);
        }

        // The text kept in the history entry of this move
        public Move withNote(String note) {
            return new Move(application, now, note, rejectionReason, expectedRevision, hiredBefore, expectedStage, terms);
        }

        public Move rejecting(String reason) {
            return new Move(application, now, note, reason, expectedRevision, hiredBefore, expectedStage, terms);
        }

        public Move answering(Integer revision, long hired) {
            return new Move(application, now, note, rejectionReason, revision, hired, expectedStage, terms);
        }

        // UC-14 extension 6a: the stage the recruiter saw when they chose the action
        public Move expecting(ApplicationStatus stage) {
            return new Move(application, now, note, rejectionReason, expectedRevision, hiredBefore, stage, terms);
        }

        public Move withTerms(OfferTerms offerTerms) {
            return new Move(application, now, note, rejectionReason, expectedRevision, hiredBefore, expectedStage,
                    offerTerms);
        }

        ApplicationStatus stage() {
            return application.getApplicationStatus();
        }

        Offer offer() {
            return application.getOffer();
        }

        JobPosting posting() {
            return application.getJobPosting();
        }

        LocalDate date() {
            return LocalDate.ofInstant(now, posting().getOrganization().getZoneId());
        }

        boolean stageChanged() {
            return expectedStage != null && expectedStage != stage();
        }

        String stageChangedMessage() {
            return "This application moved to " + stage().getLabel() + " since you opened it.";
        }

        boolean offerOpen() {
            return offer() != null && offer().getStatus() == OfferStatus.PENDING;
        }

        String offerNotOpenMessage() {
            return "This offer is no longer open. Current stage: " + stage().getLabel() + ".";
        }

        boolean postingClosed() {
            return posting().getPostStatus() == PostStatus.CLOSED;
        }

        boolean offerExpired() {
            return offer().isExpired(now, posting().getOrganization().getZoneId());
        }

        // A screen that only shows the actions does not know a revision, so it never trips this rule
        boolean revisionChanged() {
            return expectedRevision != null && !expectedRevision.equals(offer().getRevision());
        }
    }

    // For the applicant's screen: the table decides, so a button never offers a move the service refuses
    public static List<String> availableActions(Application application, Instant now) {
        Move move = Move.of(application, now);
        return TABLE.allowedEvents(move).stream().filter(APPLICANT_EVENTS::contains)
                .map(event -> event == Event.WITHDRAW_APPLICATION ? "WITHDRAW" : event.name())
                .toList();
    }

    // Seed data and fixtures: walks fig-03 from the last stage in the history, one entry per stage, dated in
    // turn by stageDates (the last date repeats). Effects do not run: add the offer, or fire the last event.
    // Starting from the history, not the stage, also repairs a database saved before histories existed.
    public static Application restore(Application application, ApplicationStatus stage, LocalDate... stageDates) {
        List<StatusHistoryEntry> history = application.getStatusHistory();
        ApplicationStatus from = history.isEmpty() ? APPLIED : history.get(history.size() - 1).getStatus();
        List<ApplicationStatus> path = TABLE.pathTo(from, stage);
        for (int i = 0; i < path.size(); i++) {
            LocalDate date = stageDates.length == 0 ? application.getDateApplied()
                    : stageDates[Math.min(i, stageDates.length - 1)];
            application.enterStage(path.get(i), date, null);
        }
        return application;
    }

    private static int lastRound(Move move) {
        return move.application().getInterviews().stream().mapToInt(Interview::getRoundNumber).max().orElse(0);
    }
}
