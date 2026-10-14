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
        assertEquals(today, application.getDateApplied());
        assertEquals("cv.pdf", application.getResumeSnapshot().getFileName());
        assertEquals(ApplicationStatus.APPLIED, application.getStatusHistory().get(0).getStatus());
        assertEquals(1, submitted.activeApplicationCount());
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

    // Submits an appplication on the day of the deadline, but before it closes.
    @Test
    void acceptsApplicationOnTheDeadlineDate() {
        JobPosting posting = save(
                "Last Day Position",
                PostStatus.PUBLISHED,
                today
        );

        SubmittedApplication submitted =
                applicationService.submitApplication(
                        posting.getJobPostId(), RESUME);

        assertEquals(1, applicationRepository.count());
        assertEquals(1, submitted.activeApplicationCount());
        assertEquals(
                ApplicationStatus.APPLIED,
                submitted.application().getApplicationStatus()
        );
    }


    // Tests if a fifth application is accepted. The maximum limit is 5 applications so it should be accepted.
    @Test
    void acceptsFifthActiveApplication() {
        for (int i = 1; i <= 4; i++) {
            JobPosting posting = save(
                    "Position " + i,
                    PostStatus.PUBLISHED,
                    today.plusDays(10)
            );
            applicationService.submitApplication(
                    posting.getJobPostId(), RESUME);
        }

        JobPosting fifth = save(
                "Position 5",
                PostStatus.PUBLISHED,
                today.plusDays(10)
        );

        SubmittedApplication submitted =
                applicationService.submitApplication(
                        fifth.getJobPostId(), RESUME);

        assertEquals(5, applicationRepository.count());
        assertEquals(5, submitted.activeApplicationCount());
    }

    // Makes sure that a rejected application is not saved in the database and properly discarded.
    @Test
    void refusesSixthApplicationWithoutSavingIt() {
        for (int i = 1; i <= 5; i++) {
            JobPosting posting = save(
                    "Position " + i,
                    PostStatus.PUBLISHED,
                    today.plusDays(10)
            );
            applicationService.submitApplication(
                    posting.getJobPostId(), RESUME);
        }

        JobPosting sixth = save(
                "Position 6",
                PostStatus.PUBLISHED,
                today.plusDays(10)
        );

        assertThrows(
                ApplicationRefusedException.class,
                () -> applicationService.submitApplication(
                        sixth.getJobPostId(), RESUME)
        );

        assertEquals(5, applicationRepository.count());
        assertTrue(applicationRepository
                .findAll()
                .stream()
                .noneMatch(a -> a.getJobPosting()
                        .getJobPostId()
                        .equals(sixth.getJobPostId())));
    }

    // Checks to see if a duplicate application overrides an original one.
    @Test
    void duplicateSubmissionDoesNotReplaceOriginalApplication() {
        JobPosting posting = save(
                "Security Engineer",
                PostStatus.PUBLISHED,
                today.plusDays(10)
        );

        SubmittedApplication original =
                applicationService.submitApplication(
                        posting.getJobPostId(), RESUME);

        ResumeSnapshot differentResume =
                new ResumeSnapshot(
                        "updated-cv.pdf",
                        "application/pdf",
                        4096L
                );

        assertThrows(
                ApplicationRefusedException.class,
                () -> applicationService.submitApplication(
                        posting.getJobPostId(), differentResume)
        );

        Application saved = applicationRepository.findById(
                original.application().getApplicationId()
        ).orElseThrow();

        assertEquals(
                "cv.pdf",
                saved.getResumeSnapshot().getFileName()
        );
        assertEquals(1, applicationRepository.count());
    }

    // Checks to see if an application moving ot the HIRED state frees up a slot.
    @Test
    void aHiredApplicationFreesItsSlot() {
        for (int i = 1; i <= 5; i++) {
            JobPosting posting = save(
                    "Position " + i,
                    PostStatus.PUBLISHED,
                    today.plusDays(10)
            );
            applicationService.submitApplication(
                    posting.getJobPostId(), RESUME);
        }

        // move one application to HIRED.
        Application hired = applicationRepository.findAll().get(0);
        hired.setApplicationStatus(ApplicationStatus.HIRED);
        applicationRepository.saveAndFlush(hired);

        // four applications remain active.
        assertEquals(
                4,
                applicationRepository.countActiveByApplicant(applicant)
        );

        // a new application should be accepted.
        JobPosting sixth = save(
                "Position 6",
                PostStatus.PUBLISHED,
                today.plusDays(10)
        );

        SubmittedApplication submitted =
                applicationService.submitApplication(
                        sixth.getJobPostId(), RESUME);

        assertEquals(5, submitted.activeApplicationCount());
        assertEquals(6, applicationRepository.count());
    }

    // Checks to see if an application being rejected frees up a slot
    @Test
    void anOfferDeclinedApplicationFreesItsSlot() {
        for (int i = 1; i <= 5; i++) {
            JobPosting posting = save(
                    "Position " + i,
                    PostStatus.PUBLISHED,
                    today.plusDays(10)
            );
            applicationService.submitApplication(
                    posting.getJobPostId(), RESUME);
        }

        // Move one application to OFFER_DECLINED.
        Application declined = applicationRepository.findAll().get(0);
        declined.setApplicationStatus(ApplicationStatus.OFFER_DECLINED);
        applicationRepository.saveAndFlush(declined);

        assertEquals(
                4,
                applicationRepository.countActiveByApplicant(applicant)
        );

        JobPosting sixth = save(
                "Position 6",
                PostStatus.PUBLISHED,
                today.plusDays(10)
        );

        SubmittedApplication submitted =
                applicationService.submitApplication(
                        sixth.getJobPostId(), RESUME);

        assertEquals(5, submitted.activeApplicationCount());
        assertEquals(6, applicationRepository.count());
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
