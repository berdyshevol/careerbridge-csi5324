package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.model.ResumeSnapshot;
import baylor.csi5324.careerbridge.repository.ApplicantRepository;
import baylor.csi5324.careerbridge.repository.ApplicationRepository;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
class ApplicationServiceTest {

    private static final ResumeSnapshot RESUME = new ResumeSnapshot("cv.pdf", "application/pdf", 2048L);

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private ApplicantRepository applicantRepository;

    @Autowired
    private JobPostingRepository jobPostingRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    private final LocalDate today = LocalDate.now();
    private Organization organization;
    private Applicant applicant;

    @BeforeEach
    void startWithAnEmptyDesk() {
        applicationRepository.deleteAll();
        organization = organizationRepository.save(new Organization("Test Organization"));
        applicant = applicantRepository.findByEmail(ApplicationService.SAMPLE_APPLICANT_EMAIL).orElseThrow();
    }

    @Test
    void createsTheApplicationAtAppliedWithACopyOfTheResume() {
        JobPosting posting = save("Software Engineer", PostStatus.PUBLISHED, today.plusDays(14));

        SubmittedApplication submitted = applicationService.submitApplication(posting.getJobPostId(), RESUME);

        Application application = applicationRepository.findById(
                submitted.application().getApplicationId()).orElseThrow();
        assertEquals(applicant.getUserId(), application.getApplicant().getUserId());
        assertEquals(ApplicationStatus.APPLIED, application.getApplicationStatus());
        // The date the organization sees, not the server's, since the two can differ near midnight
        assertEquals(LocalDate.now(organization.getZoneId()), application.getDateApplied());
        assertEquals("cv.pdf", application.getResumeSnapshot().getFileName());
        assertEquals(ApplicationStatus.APPLIED, application.getStatusHistory().get(0).getStatus());
        assertEquals(1, submitted.activeApplicationCount());
    }

    @Test
    void startsWithTheSummaryAndChangesNothing() {
        JobPosting posting = save("Software Engineer", PostStatus.PUBLISHED, today.plusDays(14));
        JobPosting other = save("DevOps Specialist", PostStatus.PUBLISHED, today.plusDays(14));
        applicationService.submitApplication(other.getJobPostId(), RESUME);

        ApplicationStart start = applicationService.startApplication(posting.getJobPostId(), RESUME);

        assertEquals("Software Engineer", start.posting().getTitle());
        assertEquals("Test Organization", start.posting().getOrganization().getName());
        assertEquals(applicant.getEmail(), start.applicant().getEmail());
        assertEquals("cv.pdf", start.resume().getFileName());
        assertEquals(1, start.activeApplicationCount());
        assertNull(start.refusal());
        assertEquals(1, applicationRepository.count());
    }

    @Test
    void startsWithNoResumeAsARefusalNotAnInventedOne() {
        JobPosting posting = save("Software Engineer", PostStatus.PUBLISHED, today.plusDays(14));

        ApplicationStart start = applicationService.startApplication(posting.getJobPostId(), null);

        assertEquals(ApplicationStart.Refusal.NO_RESUME, start.refusal());
        assertNull(start.resume());
        assertEquals("Software Engineer", start.posting().getTitle());
    }

    @Test
    void startsAtTheLimitOfFiveWithTheActiveApplicationsListed() {
        for (int i = 1; i <= ApplicationService.APPLICATION_LIMIT; i++) {
            JobPosting posting = save("Position " + i, PostStatus.PUBLISHED, today.plusDays(10));
            applicationService.submitApplication(posting.getJobPostId(), RESUME);
        }
        JobPosting sixth = save("Position 6", PostStatus.PUBLISHED, today.plusDays(10));

        ApplicationStart start = applicationService.startApplication(sixth.getJobPostId(), RESUME);

        assertEquals(ApplicationStart.Refusal.LIMIT_REACHED, start.refusal());
        assertEquals(ApplicationService.APPLICATION_LIMIT, start.activeApplicationCount());
        assertEquals(ApplicationService.APPLICATION_LIMIT, start.activeApplications().size());
    }

    @Test
    void startsBelowTheLimitWhenAnEndedApplicationFreedItsSlot() {
        for (int i = 1; i <= ApplicationService.APPLICATION_LIMIT; i++) {
            JobPosting posting = save("Position " + i, PostStatus.PUBLISHED, today.plusDays(10));
            applicationService.submitApplication(posting.getJobPostId(), RESUME);
        }
        applicationRepository.findAll().get(0).setApplicationStatus(ApplicationStatus.REJECTED);
        JobPosting sixth = save("Position 6", PostStatus.PUBLISHED, today.plusDays(10));

        ApplicationStart start = applicationService.startApplication(sixth.getJobPostId(), RESUME);

        assertNull(start.refusal());
        assertEquals(ApplicationService.APPLICATION_LIMIT - 1, start.activeApplicationCount());
    }

    @Test
    void startingOnAPostingThatDoesNotExistFails() {
        assertThrows(PostingNotFoundException.class,
                () -> applicationService.startApplication(-1L, RESUME));
    }

    @Test
    void refusesAPostingThatIsNotOpen() {
        JobPosting closed = save("Closed", PostStatus.CLOSED, today.plusDays(10));
        JobPosting expired = save("Expired", PostStatus.PUBLISHED, today.minusDays(1));
        JobPosting draft = save("Draft", PostStatus.DRAFT, today.plusDays(10));
        JobPosting noDeadline = save("No deadline", PostStatus.PUBLISHED, null);

        for (JobPosting posting : new JobPosting[] {closed, expired, draft, noDeadline}) {
            ApplicationRefusedException refused = assertThrows(ApplicationRefusedException.class,
                    () -> applicationService.submitApplication(posting.getJobPostId(), RESUME));
            assertEquals("This posting no longer accepts applications.", refused.getMessage());
        }
        assertEquals(0, applicationRepository.count());
    }

    @Test
    void refusesWithoutAResume() {
        JobPosting posting = save("Software Engineer", PostStatus.PUBLISHED, today.plusDays(14));

        ApplicationRefusedException refused = assertThrows(ApplicationRefusedException.class,
                () -> applicationService.submitApplication(posting.getJobPostId(), null));

        assertTrue(refused.getMessage().startsWith("A resume is required"));
        assertEquals(0, applicationRepository.count());
    }

    @Test
    void refusesASecondApplicationToTheSamePosting() {
        JobPosting posting = save("DevOps Specialist", PostStatus.PUBLISHED, today.plusDays(14));
        applicationService.submitApplication(posting.getJobPostId(), RESUME);

        assertThrows(ApplicationRefusedException.class,
                () -> applicationService.submitApplication(posting.getJobPostId(), RESUME));
        assertEquals(1, applicationRepository.count());
    }

    @Test
    void refusesASixthActiveApplication() {
        for (int i = 1; i <= ApplicationService.APPLICATION_LIMIT; i++) {
            JobPosting posting = save("Position " + i, PostStatus.PUBLISHED, today.plusDays(10));
            applicationService.submitApplication(posting.getJobPostId(), RESUME);
        }
        JobPosting sixth = save("Position 6", PostStatus.PUBLISHED, today.plusDays(10));

        assertThrows(ApplicationRefusedException.class,
                () -> applicationService.submitApplication(sixth.getJobPostId(), RESUME));
        assertEquals(ApplicationService.APPLICATION_LIMIT, applicationRepository.count());
    }

    @Test
    void anEndedApplicationFreesItsSlot() {
        for (int i = 1; i <= ApplicationService.APPLICATION_LIMIT; i++) {
            JobPosting posting = save("Position " + i, PostStatus.PUBLISHED, today.plusDays(10));
            applicationService.submitApplication(posting.getJobPostId(), RESUME);
        }
        Application ended = applicationRepository.findAll().get(0);
        ended.setApplicationStatus(ApplicationStatus.REJECTED);
        JobPosting sixth = save("Position 6", PostStatus.PUBLISHED, today.plusDays(10));

        SubmittedApplication submitted = applicationService.submitApplication(sixth.getJobPostId(), RESUME);

        assertEquals(ApplicationService.APPLICATION_LIMIT, submitted.activeApplicationCount());
    }

    @Test
    void listsEndedApplicationsTooSinceTheyStillBlockTheirPosting() {
        JobPosting kept = save("Kept", PostStatus.PUBLISHED, today.plusDays(10));
        JobPosting ended = save("Ended", PostStatus.PUBLISHED, today.plusDays(10));
        applicationService.submitApplication(kept.getJobPostId(), RESUME);
        applicationService.submitApplication(ended.getJobPostId(), RESUME);
        applicationRepository.findAll().stream()
                .filter(a -> a.getJobPosting().getJobPostId().equals(ended.getJobPostId()))
                .findFirst().orElseThrow().setApplicationStatus(ApplicationStatus.WITHDRAWN);

        var applications = applicationService.viewApplications();

        assertEquals(2, applications.size());
        assertTrue(applications.stream().anyMatch(a -> a.getApplicationStatus() == ApplicationStatus.WITHDRAWN));
    }

    @Test
    void listsNothingWhenTheApplicantHasNotApplied() {
        assertTrue(applicationService.viewApplications().isEmpty());
    }

    private JobPosting save(String title, PostStatus status, LocalDate deadline) {
        JobPosting posting = new JobPosting();
        posting.setOrganization(organization);
        posting.setTitle(title);
        posting.setLocation("Remote");
        posting.setPostStatus(status);
        posting.setDatePosted(today);
        posting.setApplicationDeadline(deadline);
        return jobPostingRepository.save(posting);
    }
}
