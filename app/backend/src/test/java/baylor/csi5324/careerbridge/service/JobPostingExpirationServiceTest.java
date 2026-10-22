package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.*;

class JobPostingExpirationServiceTest {

    // A deadline of 2026-10-17 closes at 23:59 local time: 04:59Z in Chicago (CDT), 06:59Z in Los Angeles (PDT)
    private static final LocalDate DEADLINE = LocalDate.of(2026, 10, 17);
    private static final Instant CHICAGO_CLOSE = Instant.parse("2026-10-18T04:59:00Z");
    private static final Instant LOS_ANGELES_CLOSE = Instant.parse("2026-10-18T06:59:00Z");
    private static final Instant TWO_DAYS_LATER = Instant.parse("2026-10-19T12:00:00Z");

    private JobPostingRepository repository;
    private JobPostingExpirationProcessor processor;
    private JobPostingExpirationService service;
    private long nextPostingId;

    @BeforeEach
    void setUp() {
        repository = mock(JobPostingRepository.class);
        processor = new JobPostingExpirationProcessor(repository);
        service = at(TWO_DAYS_LATER);
        nextPostingId = 1;
    }

    private JobPostingExpirationService at(Instant now) {
        return new JobPostingExpirationService(repository, processor, Clock.fixed(now, ZoneOffset.UTC));
    }

    private JobPosting posting(PostStatus status, LocalDate deadline) {
        return posting(status, deadline, "UTC");
    }

    private JobPosting posting(
            PostStatus status, LocalDate deadline, String timeZone) {

        Organization organization = new Organization("Test Organization");
        organization.setTimeZone(timeZone);

        JobPosting posting = new JobPosting();
        posting.setJobPostId(nextPostingId++);
        posting.setOrganization(organization);
        posting.setPostStatus(status);
        posting.setApplicationDeadline(deadline);

        return posting;
    }

    private void prepare(JobPosting... postings) {

        when(repository.findByPostStatusInAndApplicationDeadlineLessThanEqual(
                anyCollection(), any(LocalDate.class)))
                .thenAnswer(invocation -> {
                    Collection<PostStatus> statuses = invocation.getArgument(0);
                    LocalDate latestDeadline = invocation.getArgument(1);

                    return Arrays.stream(postings)
                            .filter(posting -> statuses.contains(posting.getPostStatus()))
                            .filter(posting -> posting.getApplicationDeadline() != null)
                            .filter(posting -> !posting.getApplicationDeadline()
                                    .isAfter(latestDeadline))
                            .toList();
                });

        for (JobPosting posting : postings) {
            when(repository.findById(posting.getJobPostId()))
                    .thenReturn(Optional.of(posting));
        }
    }

    @Test
    void closesOverduePublishedPosting() {
        JobPosting posting = posting(
                PostStatus.PUBLISHED, DEADLINE);

        prepare(posting);

        assertEquals(1, service.runExpirationJob());
        assertEquals(PostStatus.CLOSED, posting.getPostStatus());
        assertEquals("Expired", posting.getClosingReason());
        assertNotNull(posting.getClosedAt());

        verify(repository).saveAndFlush(posting);
    }

    @Test
    void expiresPendingApprovalPosting() {
        JobPosting posting = posting(
                PostStatus.PENDING_APPROVAL, DEADLINE);

        prepare(posting);

        assertEquals(0, service.runExpirationJob());
        assertEquals(PostStatus.EXPIRED, posting.getPostStatus());

        verify(repository).saveAndFlush(posting);
    }

    @Test
    void expiresReturnedPosting() {
        JobPosting posting = posting(
                PostStatus.RETURNED, DEADLINE);

        prepare(posting);

        assertEquals(0, service.runExpirationJob());
        assertEquals(PostStatus.EXPIRED, posting.getPostStatus());

        verify(repository).saveAndFlush(posting);
    }

    @Test
    void leavesAlreadyClosedPostingUnchanged() {
        JobPosting posting = posting(
                PostStatus.CLOSED, DEADLINE);

        prepare(posting);

        assertEquals(0, service.runExpirationJob());
        assertEquals(PostStatus.CLOSED, posting.getPostStatus());

        verify(repository, never()).saveAndFlush(any(JobPosting.class));
    }

    @Test
    void doesNotExpirePostingBeforeDeadline() {
        JobPosting posting = posting(
                PostStatus.PUBLISHED, DEADLINE.plusDays(4));

        prepare(posting);

        assertEquals(0, service.runExpirationJob());
        assertEquals(PostStatus.PUBLISHED, posting.getPostStatus());

        verify(repository, never()).saveAndFlush(any(JobPosting.class));
    }

    @Test
    void runningTwiceDoesNotCloseAgain() {
        JobPosting posting = posting(
                PostStatus.PUBLISHED, DEADLINE);

        prepare(posting);

        assertEquals(1, service.runExpirationJob());
        assertEquals(0, service.runExpirationJob());

        verify(repository, times(1)).saveAndFlush(posting);
    }

    @Test
    void keepsAChicagoPostingOpenUntil2359ThereAndClosesItAtThatMinute() {
        JobPosting posting = posting(PostStatus.PUBLISHED, DEADLINE, "America/Chicago");
        prepare(posting);

        assertEquals(0, at(CHICAGO_CLOSE.minusSeconds(60)).runExpirationJob());
        assertEquals(PostStatus.PUBLISHED, posting.getPostStatus());

        assertEquals(1, at(CHICAGO_CLOSE).runExpirationJob());
        assertEquals(PostStatus.CLOSED, posting.getPostStatus());
        assertEquals(CHICAGO_CLOSE, posting.getClosedAt());
    }

    @Test
    void keepsALosAngelesPostingOpenUntil2359ThereAndClosesItAtThatMinute() {
        JobPosting posting = posting(PostStatus.PUBLISHED, DEADLINE, "America/Los_Angeles");
        prepare(posting);

        assertEquals(0, at(LOS_ANGELES_CLOSE.minusSeconds(60)).runExpirationJob());
        assertEquals(PostStatus.PUBLISHED, posting.getPostStatus());

        assertEquals(1, at(LOS_ANGELES_CLOSE).runExpirationJob());
        assertEquals(PostStatus.CLOSED, posting.getPostStatus());
    }

    @Test
    void reachesAPostingInTheEarliestTimeZoneInItsLastMinute() {
        // 23:59 on the deadline in UTC+14 is 09:59Z the same day, before UTC+14's date moves on
        JobPosting posting = posting(PostStatus.PUBLISHED, DEADLINE, "Pacific/Kiritimati");
        prepare(posting);

        assertEquals(1, at(Instant.parse("2026-10-17T09:59:30Z")).runExpirationJob());
    }

    @Test
    void rejectsInvalidOrganizationTimeZone() {
        Organization organization = new Organization("Test Organization");

        assertThrows(
                java.time.DateTimeException.class,
                () -> organization.setTimeZone("Invalid/TimeZone"));
    }

    @Test
    void failureInOnePostingDoesNotStopRemainingPostings() {
        JobPosting failingPosting = posting(
                PostStatus.PUBLISHED, DEADLINE);

        JobPosting successfulPosting = posting(
                PostStatus.PUBLISHED, DEADLINE);

        prepare(failingPosting, successfulPosting);

        when(repository.saveAndFlush(failingPosting))
                .thenThrow(new IllegalStateException("Database update failed"));

        assertEquals(1, service.runExpirationJob());

        verify(repository).saveAndFlush(failingPosting);
        verify(repository).saveAndFlush(successfulPosting);

        assertEquals(PostStatus.CLOSED, successfulPosting.getPostStatus());
        assertEquals("Expired", successfulPosting.getClosingReason());
    }
}
