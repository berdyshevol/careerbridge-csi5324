
package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.*;

class JobPostingExpirationServiceTest {

    private JobPostingRepository repository;
    private JobPostingExpirationService service;
    private long nextPostingId;

    @BeforeEach
    void setUp() {
        repository = mock(JobPostingRepository.class);

        JobPostingExpirationProcessor processor =
                new JobPostingExpirationProcessor(repository);

        service = new JobPostingExpirationService(repository, processor);
        nextPostingId = 1;
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

        // Simulate the repository's filtered query.
        // Only postings in the requested statuses and date range are returned.
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

    private LocalDate today(String timeZone) {
        return LocalDate.now(ZoneId.of(timeZone));
    }

    @Test
    void closesOverduePublishedPosting() {
        JobPosting posting = posting(
                PostStatus.PUBLISHED, today("UTC").minusDays(2));

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
                PostStatus.PENDING_APPROVAL, today("UTC").minusDays(2));

        prepare(posting);

        assertEquals(0, service.runExpirationJob());
        assertEquals(PostStatus.EXPIRED, posting.getPostStatus());

        verify(repository).saveAndFlush(posting);
    }

    @Test
    void expiresReturnedPosting() {
        JobPosting posting = posting(
                PostStatus.RETURNED, today("UTC").minusDays(2));

        prepare(posting);

        assertEquals(0, service.runExpirationJob());
        assertEquals(PostStatus.EXPIRED, posting.getPostStatus());

        verify(repository).saveAndFlush(posting);
    }

    @Test
    void leavesAlreadyClosedPostingUnchanged() {
        JobPosting posting = posting(
                PostStatus.CLOSED, today("UTC").minusDays(2));

        prepare(posting);

        assertEquals(0, service.runExpirationJob());
        assertEquals(PostStatus.CLOSED, posting.getPostStatus());

        verify(repository, never()).saveAndFlush(any(JobPosting.class));
    }

    @Test
    void doesNotExpirePostingBeforeDeadline() {
        JobPosting posting = posting(
                PostStatus.PUBLISHED, today("UTC").plusDays(2));

        prepare(posting);

        assertEquals(0, service.runExpirationJob());
        assertEquals(PostStatus.PUBLISHED, posting.getPostStatus());

        verify(repository, never()).saveAndFlush(any(JobPosting.class));
    }

    @Test
    void runningTwiceDoesNotCloseAgain() {
        JobPosting posting = posting(
                PostStatus.PUBLISHED, today("UTC").minusDays(2));

        prepare(posting);

        assertEquals(1, service.runExpirationJob());
        assertEquals(0, service.runExpirationJob());

        verify(repository, times(1)).saveAndFlush(posting);
    }

    @Test
    void respectsChicagoTimeZone() {
        JobPosting posting = posting(
                PostStatus.PUBLISHED,
                today("America/Chicago").minusDays(2),
                "America/Chicago");

        prepare(posting);

        assertEquals(1, service.runExpirationJob());
        assertEquals(PostStatus.CLOSED, posting.getPostStatus());
    }

    @Test
    void respectsLosAngelesTimeZone() {
        JobPosting posting = posting(
                PostStatus.PUBLISHED,
                today("America/Los_Angeles").minusDays(2),
                "America/Los_Angeles");

        prepare(posting);

        assertEquals(1, service.runExpirationJob());
        assertEquals(PostStatus.CLOSED, posting.getPostStatus());
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
                PostStatus.PUBLISHED, today("UTC").minusDays(2));

        JobPosting successfulPosting = posting(
                PostStatus.PUBLISHED, today("UTC").minusDays(2));

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
