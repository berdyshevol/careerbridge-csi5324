package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.dto.PostingSearchCriteria;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class JobPostingSearchDeadlineTest {

    // 04:59Z on 2026-10-18 is 23:59 on 2026-10-17 in Chicago, and still 2026-10-17 at UTC-12
    private static final Instant NOW = Instant.parse("2026-10-18T04:59:00Z");

    private final JobPostingRepository repository = mock(JobPostingRepository.class);
    private final JobPostingService service = new JobPostingService(
            repository, mock(OrganizationRepository.class), Clock.fixed(NOW, ZoneOffset.UTC));

    private static JobPosting posting(String title, String timeZone) {
        Organization organization = new Organization(title + " Inc");
        organization.setTimeZone(timeZone);
        JobPosting posting = new JobPosting();
        posting.setTitle(title);
        posting.setOrganization(organization);
        posting.setPostStatus(PostStatus.PUBLISHED);
        posting.setApplicationDeadline(LocalDate.of(2026, 10, 17));
        return posting;
    }

    @Test
    void asksTheDatabaseOnlyForDeadlinesNotYetPassedAtUtcMinus12() {
        when(repository.findByPostStatusAndApplicationDeadlineGreaterThanEqualOrderByDatePostedDescJobPostIdDesc(
                any(), any())).thenReturn(List.of());

        service.searchPostings(PostingSearchCriteria.ANY);

        verify(repository).findByPostStatusAndApplicationDeadlineGreaterThanEqualOrderByDatePostedDescJobPostIdDesc(
                eq(PostStatus.PUBLISHED), eq(LocalDate.of(2026, 10, 17)));
    }

    @Test
    void dropsTheRowsWhoseOrganizationHasAlreadyReached2359() {
        when(repository.findByPostStatusAndApplicationDeadlineGreaterThanEqualOrderByDatePostedDescJobPostIdDesc(
                any(), any())).thenReturn(List.of(
                        posting("Chicago role", "America/Chicago"),
                        posting("Los Angeles role", "America/Los_Angeles")));

        List<String> titles = service.searchPostings(PostingSearchCriteria.ANY).stream()
                .map(JobPosting::getTitle)
                .toList();

        assertEquals(List.of("Los Angeles role"), titles);
    }
}
