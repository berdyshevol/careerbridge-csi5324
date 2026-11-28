package baylor.csi5324.careerbridge.model;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

// fig-04 (BR-9, BR-10, A9) and Close Job Posting without Spring
class JobPostingLifecycleTest {

    private static final LocalDate DEADLINE = LocalDate.of(2026, 10, 31);
    private static final Instant BEFORE_DEADLINE = Instant.parse("2026-10-20T15:00:00Z");
    private static final Instant AFTER_DEADLINE = Instant.parse("2026-11-02T15:00:00Z");

    private static JobPosting draft() {
        JobPosting posting = new JobPosting();
        posting.setOrganization(new Organization("Brazos Analytics"));
        posting.setApplicationDeadline(DEADLINE);
        return posting;
    }

    private static JobPosting pending() {
        JobPosting posting = draft();
        posting.submit();
        return posting;
    }

    @Test
    void theLifecycleIsExactlyTheArrowsOfFig04() {
        int arrows = 0;
        for (PostStatus from : PostStatus.values()) {
            arrows += from.allowedMoves().size();
        }
        assertEquals(8, arrows);
        assertTrue(PostStatus.RETURNED.canMoveTo(PostStatus.PENDING_APPROVAL));
        assertFalse(PostStatus.DRAFT.canMoveTo(PostStatus.CLOSED));
    }

    @Test
    void approvingBeforeTheDeadlinePublishesAndDatesThePosting() {
        JobPosting posting = pending();

        assertEquals(PostStatus.PUBLISHED, posting.approve("Admin", "Looks good", BEFORE_DEADLINE));
        assertEquals(LocalDate.of(2026, 10, 20), posting.getDatePosted());
        assertEquals("Admin", posting.getApprovedBy());
    }

    @Test
    void approvingAfterTheDeadlineReturnsThePostingInstead() {
        JobPosting posting = pending();

        assertEquals(PostStatus.RETURNED, posting.approve("Admin", "Looks good", AFTER_DEADLINE));
        assertEquals(JobPosting.DEADLINE_PASSED, posting.getReviewComment());
    }

    @Test
    void aDecidedPostingIsNotDecidedAgain() {
        JobPosting posting = pending();
        posting.reject("Admin", "Duplicate", BEFORE_DEADLINE);

        PostingStateConflictException refused = assertThrows(PostingStateConflictException.class,
                () -> posting.approve("Other Admin", null, BEFORE_DEADLINE));
        assertEquals("This posting was already decided: it is Rejected", refused.getMessage());
    }

    @Test
    void aDraftCannotBeClosed() {
        JobPosting posting = draft();

        assertThrows(PostingStateConflictException.class, () -> posting.closeByRecruiter(BEFORE_DEADLINE));
        assertThrows(PostingStateConflictException.class, () -> posting.fill(List.of(), BEFORE_DEADLINE));
        assertEquals(PostStatus.DRAFT, posting.getPostStatus());
    }

    @Test
    void fillingClosesThePostingAndEndsEveryOtherActiveApplication() {
        JobPosting posting = pending();
        posting.approve("Admin", null, BEFORE_DEADLINE);
        Application screening = Lifecycles.atStage(apply(posting), ApplicationStatus.SCREENING);
        Application offered = Lifecycles.atStage(apply(posting), ApplicationStatus.OFFER);

        posting.fill(List.of(screening, offered), BEFORE_DEADLINE);

        assertEquals(PostStatus.CLOSED, posting.getPostStatus());
        assertEquals(JobPosting.FILLED, posting.getClosingReason());
        assertNotNull(posting.getClosedAt());
        for (Application other : List.of(screening, offered)) {
            assertEquals(ApplicationStatus.REJECTED, other.getApplicationStatus());
            assertEquals(Application.POSTING_CLOSED, other.getRejectionReason());
        }
        assertEquals(OfferStatus.RESCINDED, offered.getOffer().getStatus());
    }

    @Test
    void expiresAPublishedPostingAsClosedAndAWaitingOneAsExpired() {
        JobPosting published = pending();
        published.approve("Admin", null, BEFORE_DEADLINE);
        JobPosting waiting = pending();
        JobPosting draft = draft();

        assertEquals(PostStatus.CLOSED, published.expire(AFTER_DEADLINE));
        assertEquals(JobPosting.EXPIRED, published.getClosingReason());
        assertEquals(PostStatus.EXPIRED, waiting.expire(AFTER_DEADLINE));
        assertFalse(draft.isDueToExpire(AFTER_DEADLINE));
        assertFalse(published.isDueToExpire(AFTER_DEADLINE));
    }

    @Test
    void aRecruiterDoesNotCloseAPostingPastItsDeadline() {
        JobPosting posting = pending();
        posting.approve("Admin", null, BEFORE_DEADLINE);

        assertThrows(PostingStateConflictException.class, () -> posting.closeByRecruiter(AFTER_DEADLINE));
        posting.closeByRecruiter(BEFORE_DEADLINE);
        assertEquals(JobPosting.CLOSED_BY_RECRUITER, posting.getClosingReason());
    }

    private static Application apply(JobPosting posting) {
        return new Application(new Applicant(), posting, new ResumeSnapshot("cv.pdf", "application/pdf", 1L),
                LocalDate.of(2026, 10, 21));
    }
}
