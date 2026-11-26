package baylor.csi5324.careerbridge.config;

import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.model.Recruiter;
import baylor.csi5324.careerbridge.repository.ApplicantRepository;
import baylor.csi5324.careerbridge.repository.ApplicationRepository;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import baylor.csi5324.careerbridge.repository.RecruiterRepository;
import baylor.csi5324.careerbridge.service.ApplicationService;
import baylor.csi5324.careerbridge.service.RecruiterOrganization;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DemoPostingsTest {

    private static final String RILEY = "riley.chen@example.com";
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-11-25T18:00:00Z"), ZoneOffset.UTC);

    private final JobPostingRepository jobPostingRepository = mock(JobPostingRepository.class);
    private final RecruiterRepository recruiterRepository = mock(RecruiterRepository.class);
    private final RecruiterOrganization recruiterOrganization = mock(RecruiterOrganization.class);
    private final ApplicantRepository applicantRepository = mock(ApplicantRepository.class);
    private final ApplicationRepository applicationRepository = mock(ApplicationRepository.class);
    private final Applicant first = applicant("casey.nguyen@example.com");
    private final Applicant second = applicant("devon.patel@example.com");

    private static Applicant applicant(String email) {
        Applicant applicant = new Applicant();
        applicant.setEmail(email);
        return applicant;
    }
    private final Organization brazos = new Organization("Brazos Analytics");

    // Only Riley has an account and an organization, as on a database without the numbered recruiters
    private DemoPostings demoPostings(boolean enabled) {
        Recruiter riley = new Recruiter();
        riley.setEmail(RILEY);
        when(recruiterRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(recruiterRepository.findByEmailIgnoreCase(RILEY)).thenReturn(Optional.of(riley));
        when(recruiterOrganization.activeOrganizationOf(anyString())).thenReturn(Optional.empty());
        when(recruiterOrganization.activeOrganizationOf(RILEY)).thenReturn(Optional.of(brazos));
        when(jobPostingRepository.save(any(JobPosting.class))).thenAnswer(call -> call.getArgument(0));
        when(applicantRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(applicantRepository.findByEmailIgnoreCase("casey.nguyen@example.com")).thenReturn(Optional.of(first));
        when(applicantRepository.findByEmailIgnoreCase("devon.patel@example.com")).thenReturn(Optional.of(second));
        when(applicantRepository.save(any(Applicant.class))).thenAnswer(call -> call.getArgument(0));
        return new DemoPostings(jobPostingRepository, recruiterRepository, applicantRepository, applicationRepository,
                recruiterOrganization, CLOCK, enabled);
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
        JobPosting existing = new JobPosting();
        existing.setTitle("Data Platform Engineer");
        existing.setPostStatus(PostStatus.CLOSED);
        when(jobPostingRepository.findFirstByOrganizationAndTitleIgnoreCase(brazos, "Data Platform Engineer"))
                .thenReturn(Optional.of(existing));

        demoPostings(true).run();

        assertThat(saved()).hasSize(3).extracting(JobPosting::getTitle).doesNotContain("Data Platform Engineer");
    }

    @Test
    void addsNothingWhenSwitchedOff() throws Exception {
        demoPostings(false).run();

        verify(jobPostingRepository, never()).save(any(JobPosting.class));
    }

    @Test
    void putsTwoApplicantsOnThePublishedPosting() throws Exception {
        demoPostings(true).run();

        ArgumentCaptor<Application> captor = ArgumentCaptor.forClass(Application.class);
        verify(applicationRepository, times(2)).save(captor.capture());
        assertThat(captor.getAllValues()).allSatisfy(application ->
                assertThat(application.getJobPosting().getPostStatus()).isEqualTo(PostStatus.PUBLISHED));
        assertThat(captor.getAllValues()).extracting(application -> application.getApplicant().getEmail(),
                Application::getApplicationStatus).containsExactly(
                tuple("casey.nguyen@example.com", ApplicationStatus.APPLIED),
                tuple("devon.patel@example.com", ApplicationStatus.SCREENING));
    }

    @Test
    void createsTheDemoApplicantsWhoAreMissing() throws Exception {
        demoPostings(true).run();

        ArgumentCaptor<Applicant> created = ArgumentCaptor.forClass(Applicant.class);
        verify(applicantRepository, times(2)).save(created.capture());
        assertThat(created.getAllValues()).extracting(Applicant::getEmail)
                .containsExactly("alex.kim@example.com", "jamie.ortiz@example.com");
    }

    @Test
    void leavesOutAnApplicantWhoReachedTheLimit() throws Exception {
        List<Application> five = new ArrayList<>();
        for (int i = 0; i < ApplicationService.APPLICATION_LIMIT; i++) {
            Application application = new Application(first, new JobPosting(), null, LocalDate.of(2026, 11, 1));
            five.add(application);
        }
        when(applicationRepository.findByApplicant(first)).thenReturn(five);

        demoPostings(true).run();

        verify(applicationRepository, times(1)).save(any(Application.class));
    }
}
