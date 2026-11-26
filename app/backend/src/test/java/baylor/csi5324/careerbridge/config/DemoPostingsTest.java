package baylor.csi5324.careerbridge.config;

import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.model.Recruiter;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import baylor.csi5324.careerbridge.repository.RecruiterRepository;
import baylor.csi5324.careerbridge.service.RecruiterOrganization;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DemoPostingsTest {

    private static final String RILEY = "riley.chen@example.com";
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-11-25T18:00:00Z"), ZoneOffset.UTC);

    private final JobPostingRepository jobPostingRepository = mock(JobPostingRepository.class);
    private final RecruiterRepository recruiterRepository = mock(RecruiterRepository.class);
    private final RecruiterOrganization recruiterOrganization = mock(RecruiterOrganization.class);
    private final Organization brazos = new Organization("Brazos Analytics");

    // Only Riley has an account and an organization, as on a database without the numbered recruiters
    private DemoPostings demoPostings(boolean enabled) {
        Recruiter riley = new Recruiter();
        riley.setEmail(RILEY);
        when(recruiterRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(recruiterRepository.findByEmailIgnoreCase(RILEY)).thenReturn(Optional.of(riley));
        when(recruiterOrganization.activeOrganizationOf(anyString())).thenReturn(Optional.empty());
        when(recruiterOrganization.activeOrganizationOf(RILEY)).thenReturn(Optional.of(brazos));
        return new DemoPostings(jobPostingRepository, recruiterRepository, recruiterOrganization, CLOCK, enabled);
    }

    private List<JobPosting> saved() {
        ArgumentCaptor<JobPosting> captor = ArgumentCaptor.forClass(JobPosting.class);
        verify(jobPostingRepository, atLeastOnce()).save(captor.capture());
        return captor.getAllValues();
    }

    @Test
    void givesTheRecruiterAPostingInEveryStatus() throws Exception {
        demoPostings(true).run();

        Map<PostStatus, JobPosting> byStatus = saved().stream()
                .collect(Collectors.toMap(JobPosting::getPostStatus, Function.identity()));
        assertThat(byStatus).containsOnlyKeys(
                PostStatus.PUBLISHED, PostStatus.PENDING_APPROVAL, PostStatus.RETURNED, PostStatus.CLOSED);
        assertThat(byStatus.values()).allSatisfy(posting -> {
            assertThat(posting.getOrganization()).isSameAs(brazos);
            assertThat(posting.getRecruiter().getEmail()).isEqualTo(RILEY);
            assertThat(posting.getApplicationDeadline()).isAfter(LocalDate.of(2027, 1, 31));
        });
        assertThat(byStatus.get(PostStatus.RETURNED).getReviewComment()).isNotBlank();
        assertThat(byStatus.get(PostStatus.PUBLISHED).getApprovedBy()).isEqualTo(DemoPostings.APPROVED_BY);
        assertThat(byStatus.get(PostStatus.CLOSED).getClosingReason()).isEqualTo("Closed by recruiter");
    }

    @Test
    void leavesAPostingTheOrganizationAlreadyHas() throws Exception {
        when(jobPostingRepository.existsByOrganizationAndTitleIgnoreCase(brazos, "Data Platform Engineer"))
                .thenReturn(true);

        demoPostings(true).run();

        assertThat(saved()).hasSize(3).extracting(JobPosting::getTitle).doesNotContain("Data Platform Engineer");
    }

    @Test
    void addsNothingWhenSwitchedOff() throws Exception {
        demoPostings(false).run();

        verify(jobPostingRepository, never()).save(any(JobPosting.class));
    }
}
