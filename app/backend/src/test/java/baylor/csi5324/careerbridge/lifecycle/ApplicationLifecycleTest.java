package baylor.csi5324.careerbridge.lifecycle;

import baylor.csi5324.careerbridge.lifecycle.ApplicationLifecycle.Event;
import baylor.csi5324.careerbridge.lifecycle.ApplicationLifecycle.Move;
import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.Interview;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.OfferStatus;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.model.ResumeSnapshot;
import baylor.csi5324.careerbridge.model.StatusHistoryEntry;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;

import static baylor.csi5324.careerbridge.model.ApplicationStatus.APPLIED;
import static baylor.csi5324.careerbridge.model.ApplicationStatus.INTERVIEW;
import static baylor.csi5324.careerbridge.model.ApplicationStatus.OFFER;
import static baylor.csi5324.careerbridge.model.ApplicationStatus.REJECTED;
import static baylor.csi5324.careerbridge.model.ApplicationStatus.SCREENING;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// No Spring: the pipeline is plain objects, including the UC-14 and UC-15 moves that have no screen yet
class ApplicationLifecycleTest {

    private static final Instant NOW = Instant.parse("2026-11-02T15:00:00Z");
    private static final OfferTerms TERMS = new OfferTerms(LocalDate.of(2027, 1, 4), "70,000 USD per year",
            "Hybrid", LocalDate.of(2026, 11, 20), null);

    private final JobPosting posting = publishedPosting();
    private final Application application = new Application(new Applicant(), posting,
            new ResumeSnapshot("cv.pdf", "application/pdf", 1024L), LocalDate.of(2026, 10, 1));

    @Test
    void advancesOneStageAtATimeAndKeepsTheHistoryInStep() {
        fire(Event.ADVANCE_APPLICATION);
        fire(Event.ADVANCE_APPLICATION);

        assertThat(application.getApplicationStatus()).isEqualTo(INTERVIEW);
        assertThat(application.getStatusHistory()).extracting(StatusHistoryEntry::getStatus)
                .containsExactly(APPLIED, SCREENING, INTERVIEW);
    }

    @Test
    void refusesToAdvancePastInterviewOrOutOfAnEndedStage() {
        ApplicationLifecycle.restore(application, INTERVIEW);
        assertThat(refusal(Move.of(application, NOW), Event.ADVANCE_APPLICATION))
                .contains("pipeline is fixed");

        ApplicationLifecycle.restore(application, REJECTED);
        assertThatThrownBy(() -> fire(Event.ADVANCE_APPLICATION)).isInstanceOf(TransitionRefusedException.class);
        assertThat(application.getApplicationStatus()).isEqualTo(REJECTED);
    }

    @Test
    void refusesAMoveWhenTheStageChangedSinceTheRecruiterLooked() {
        ApplicationLifecycle.restore(application, SCREENING);

        assertThat(refusal(Move.of(application, NOW).expecting(APPLIED), Event.REJECT_APPLICATION))
                .isEqualTo("This application moved to Screening since you opened it.");
    }

    @Test
    void extendsAnOfferFromInterviewUnlessThePostingClosed() {
        ApplicationLifecycle.restore(application, INTERVIEW);

        ApplicationLifecycle.TABLE.fire(Move.of(application, NOW).withTerms(TERMS), Event.EXTEND_OFFER);

        assertThat(application.getApplicationStatus()).isEqualTo(OFFER);
        assertThat(application.getOffer().getStatus()).isEqualTo(OfferStatus.PENDING);
        assertThat(application.getOffer().getDateExtended()).isEqualTo(LocalDate.of(2026, 11, 2));

        Application other = new Application(new Applicant(), posting, null, LocalDate.of(2026, 10, 1));
        ApplicationLifecycle.restore(other, INTERVIEW);
        JobPostingLifecycle.fire(posting, NOW, JobPostingLifecycle.Event.FILL_POSTING);
        assertThat(refusal(Move.of(other, NOW).withTerms(TERMS), Event.EXTEND_OFFER)).contains("closed");
    }

    @Test
    void revisingAnOfferBumpsItsRevisionWithoutAStageChange() {
        withOffer();
        int historyBefore = application.getStatusHistory().size();

        ApplicationLifecycle.TABLE.fire(Move.of(application, NOW).withTerms(TERMS), Event.REVISE_OFFER);

        assertThat(application.getOffer().getRevision()).isEqualTo(2);
        assertThat(application.getStatusHistory()).hasSize(historyBefore);

        ApplicationLifecycle.TABLE.fire(Move.of(application, NOW).withNote("Too far"), Event.DECLINE_OFFER);
        assertThat(refusal(Move.of(application, NOW).withTerms(TERMS), Event.REVISE_OFFER))
                .contains("no longer open");
    }

    @Test
    void rejectingAtOfferRescindsTheOpenOffer() {
        withOffer();

        ApplicationLifecycle.TABLE.fire(Move.of(application, NOW).rejecting("Position filled internally")
                .withNote("Internal candidate"), Event.REJECT_APPLICATION);

        assertThat(application.getApplicationStatus()).isEqualTo(REJECTED);
        assertThat(application.getRejectionReason()).isEqualTo("Position filled internally");
        assertThat(application.getRejectedAtStage()).isEqualTo(OFFER);
        assertThat(application.getOffer().getStatus()).isEqualTo(OfferStatus.RESCINDED);
    }

    @Test
    void recordsAtMostTwoInterviewRoundsAndOnlyAtInterview() {
        assertThat(refusal(Move.of(application, NOW), Event.RECORD_INTERVIEW)).isNotNull();

        ApplicationLifecycle.restore(application, INTERVIEW);
        fire(Event.RECORD_INTERVIEW);
        application.getInterviews().add(new Interview(application, 2, NOW.atZone(posting.getOrganization().getZoneId())
                .toLocalDateTime(), "Video", "Zoom"));

        assertThat(refusal(Move.of(application, NOW), Event.RECORD_INTERVIEW)).contains("2 interview rounds");
        assertThat(application.getApplicationStatus()).isEqualTo(INTERVIEW);
    }

    @Test
    void theApplicantSeesOnlyTheActionsTheTableAllows() {
        assertThat(ApplicationLifecycle.availableActions(application, NOW)).containsExactly("WITHDRAW");

        withOffer();
        assertThat(ApplicationLifecycle.availableActions(application, NOW))
                .containsExactly("ACCEPT_OFFER", "DECLINE_OFFER");
        assertThat(refusal(Move.of(application, NOW), Event.WITHDRAW_APPLICATION)).contains("Use Decline");

        assertThat(ApplicationLifecycle.availableActions(application, Instant.parse("2026-12-01T15:00:00Z")))
                .isEmpty();
    }

    @Test
    void restoreOnlyBuildsStagesTheFigureCanReach() {
        ApplicationLifecycle.restore(application, ApplicationStatus.WITHDRAWN);

        assertThatThrownBy(() -> ApplicationLifecycle.restore(application, OFFER))
                .isInstanceOf(IllegalArgumentException.class);
    }

    private void withOffer() {
        ApplicationLifecycle.restore(application, INTERVIEW);
        ApplicationLifecycle.TABLE.fire(Move.of(application, NOW).withTerms(TERMS), Event.EXTEND_OFFER);
    }

    private void fire(Event event) {
        ApplicationLifecycle.TABLE.fire(Move.of(application, NOW), event);
    }

    private static String refusal(Move move, Event event) {
        return ApplicationLifecycle.TABLE.refusal(move, event).map(StateMachine.Refusal::message).orElse(null);
    }

    private static JobPosting publishedPosting() {
        JobPosting posting = new JobPosting();
        posting.setOrganization(new Organization("Brazos Analytics"));
        posting.setNumberOfOpenings(1);
        posting.setApplicationDeadline(LocalDate.of(2026, 12, 15));
        return JobPostingLifecycle.restore(posting, PostStatus.PUBLISHED);
    }

}
