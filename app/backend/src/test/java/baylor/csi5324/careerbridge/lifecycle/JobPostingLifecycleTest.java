package baylor.csi5324.careerbridge.lifecycle;

import baylor.csi5324.careerbridge.lifecycle.JobPostingLifecycle.Event;
import baylor.csi5324.careerbridge.lifecycle.JobPostingLifecycle.Move;
import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Offer;
import baylor.csi5324.careerbridge.model.OfferStatus;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.PostStatus;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JobPostingLifecycleTest {

    private static final Instant BEFORE_DEADLINE = Instant.parse("2026-11-02T15:00:00Z");
    private static final Instant AFTER_DEADLINE = Instant.parse("2026-12-20T15:00:00Z");

    @Test
    void approvingAfterTheDeadlineReturnsThePostingInstead() {
        JobPosting posting = JobPostingLifecycle.restore(posting(), PostStatus.PENDING_APPROVAL);

        JobPostingLifecycle.TABLE.fire(Move.of(posting, AFTER_DEADLINE).decidedBy("Admin", "Fine", true),
                Event.APPROVE_JOB_POSTING);

        assertThat(posting.getPostStatus()).isEqualTo(PostStatus.RETURNED);
        assertThat(posting.getReviewComment()).isEqualTo(JobPostingLifecycle.DEADLINE_PASSED);
    }

    @Test
    void approvalWaitsWhileTheSubmitterIsNoLongerAMember() {
        JobPosting posting = JobPostingLifecycle.restore(posting(), PostStatus.PENDING_APPROVAL);

        assertThat(JobPostingLifecycle.TABLE.refusal(Move.of(posting, BEFORE_DEADLINE).decidedBy("Admin", null, false),
                Event.APPROVE_JOB_POSTING)).map(StateMachine.Refusal::rule).contains("recruiter inactive");
    }

    @Test
    void expiryFollowsFigure4FromEachState() {
        JobPosting published = JobPostingLifecycle.restore(posting(), PostStatus.PUBLISHED);
        JobPosting returned = JobPostingLifecycle.restore(posting(), PostStatus.RETURNED);

        JobPostingLifecycle.fire(published, AFTER_DEADLINE, Event.EXPIRE_POSTING);
        JobPostingLifecycle.fire(returned, AFTER_DEADLINE, Event.EXPIRE_POSTING);

        assertThat(published.getPostStatus()).isEqualTo(PostStatus.CLOSED);
        assertThat(published.getClosingReason()).isEqualTo("Expired");
        assertThat(returned.getPostStatus()).isEqualTo(PostStatus.EXPIRED);
    }

    @Test
    void aFilledPostingIsNeverOverwrittenAsExpiredAndADraftIsNeverClosed() {
        JobPosting filled = LifecycleFixtures.closed(posting(), Event.FILL_POSTING, BEFORE_DEADLINE);
        JobPosting draft = posting();

        assertThatThrownBy(() -> JobPostingLifecycle.fire(filled, AFTER_DEADLINE, Event.EXPIRE_POSTING))
                .isInstanceOf(TransitionRefusedException.class);
        assertThatThrownBy(() -> JobPostingLifecycle.fire(draft, BEFORE_DEADLINE, Event.CLOSE_POSTING))
                .hasMessage("Only a published posting can be closed; this one is Draft");
        assertThat(filled.getClosingReason()).isEqualTo("Filled");
    }

    // UC-07 extension 6c: one transition across the posting, the other applications and their offers
    @Test
    void fillingTheLastOpeningClosesThePostingAndRejectsTheRest() {
        JobPosting posting = JobPostingLifecycle.restore(posting(), PostStatus.PUBLISHED);
        Application screening = ApplicationLifecycle.restore(application(posting), ApplicationStatus.SCREENING);
        Application offered = LifecycleFixtures.withOffer(application(posting), null);
        offered.setOffer(new Offer(offered, LocalDate.of(2026, 11, 1), LocalDate.of(2027, 1, 4), "1", null,
                LocalDate.of(2026, 11, 30), null));

        assertThat(PostingFilled.fillsLastOpening(posting, 0)).isTrue();
        List<Application> rejected = PostingFilled.closeFilledPosting(posting, List.of(screening, offered),
                BEFORE_DEADLINE);

        assertThat(posting.getPostStatus()).isEqualTo(PostStatus.CLOSED);
        assertThat(posting.getClosingReason()).isEqualTo("Filled");
        assertThat(rejected).extracting(Application::getApplicationStatus).containsOnly(ApplicationStatus.REJECTED);
        assertThat(rejected).extracting(Application::getRejectionReason).containsOnly("Posting closed");
        assertThat(offered.getOffer().getStatus()).isEqualTo(OfferStatus.RESCINDED);
    }

    private static Application application(JobPosting posting) {
        return new Application(new Applicant(), posting, null, LocalDate.of(2026, 10, 1));
    }

    private static JobPosting posting() {
        JobPosting posting = new JobPosting();
        posting.setOrganization(new Organization("Brazos Analytics"));
        posting.setNumberOfOpenings(1);
        posting.setApplicationDeadline(LocalDate.of(2026, 12, 15));
        return posting;
    }
}
