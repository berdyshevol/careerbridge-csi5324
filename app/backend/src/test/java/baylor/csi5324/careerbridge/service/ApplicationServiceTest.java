package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.AccountStatus;
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
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
class ApplicationServiceTest {

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
    void setUp() {
        applicationRepository.deleteAll();
        jobPostingRepository.deleteAll();
        applicantRepository.deleteAll();

        organization = organizationRepository.save(new Organization("Baylor Tech Inc"));

        applicant = new Applicant();
        applicant.setFirstName("Grace");
        applicant.setLastName("Hopper");
        applicant.setEmail("grace.hopper@careerbridge.local");
        applicant.setPhone("254-555-0100");
        applicant.setAccountStatus(AccountStatus.ACTIVE);
        applicant = applicantRepository.save(applicant);
    }

    @Test
    void submitApplicationCreatesApplicationInAppliedStageWithSnapshotAndHistory() {
        JobPosting posting = savePosting("Software Engineer", PostStatus.PUBLISHED, today.plusDays(14));
        ResumeSnapshot resume = new ResumeSnapshot("my_resume.pdf", "application/pdf", 2048L);

        Application application = applicationService.submitApplication(
                posting.getJobPostId(), applicant.getUserId(), resume);

        assertNotNull(application.getApplicationId());
        assertEquals(ApplicationStatus.APPLIED, application.getApplicationStatus());
        assertEquals(today, application.getDateApplied());
        assertEquals("my_resume.pdf", application.getResumeSnapshot().getFileName());
        assertEquals(1, application.getStatusHistory().size());
        assertEquals(ApplicationStatus.APPLIED, application.getStatusHistory().get(0).getStatus());

        assertEquals(1, applicationService.getActiveApplicationCount(applicant.getUserId()));
        assertTrue(applicationService.hasApplied(posting.getJobPostId(), applicant.getUserId()));
    }

    @Test
    void submitApplicationRejectsClosedPosting() {
        JobPosting closedPosting = savePosting("Closed Role", PostStatus.CLOSED, today.plusDays(10));

        assertThrows(PostingClosedException.class, () ->
                applicationService.submitApplication(closedPosting.getJobPostId(), applicant.getUserId(), null));
    }

    @Test
    void submitApplicationRejectsExpiredDeadline() {
        JobPosting expiredPosting = savePosting("Expired Role", PostStatus.PUBLISHED, today.minusDays(1));

        assertThrows(PostingClosedException.class, () ->
                applicationService.submitApplication(expiredPosting.getJobPostId(), applicant.getUserId(), null));
    }

    @Test
    void submitApplicationRejectsDraftOrPendingPostings() {
        JobPosting draftPosting = savePosting("Draft Role", PostStatus.DRAFT, today.plusDays(10));
        JobPosting pendingPosting = savePosting("Pending Role", PostStatus.PENDING_APPROVAL, today.plusDays(10));

        assertThrows(PostingClosedException.class, () ->
                applicationService.submitApplication(draftPosting.getJobPostId(), applicant.getUserId(), null));
        assertThrows(PostingClosedException.class, () ->
                applicationService.submitApplication(pendingPosting.getJobPostId(), applicant.getUserId(), null));
    }

    @Test
    void submitApplicationRejectsDuplicateApplication() {
        JobPosting posting = savePosting("DevOps Specialist", PostStatus.PUBLISHED, today.plusDays(14));

        applicationService.submitApplication(posting.getJobPostId(), applicant.getUserId(), null);

        assertThrows(DuplicateApplicationException.class, () ->
                applicationService.submitApplication(posting.getJobPostId(), applicant.getUserId(), null));
    }

    @Test
    void submitApplicationEnforcesFiveActiveApplicationsLimit() {
        // Submit 5 active applications (BR-4)
        for (int i = 1; i <= 5; i++) {
            JobPosting posting = savePosting("Position " + i, PostStatus.PUBLISHED, today.plusDays(10));
            applicationService.submitApplication(posting.getJobPostId(), applicant.getUserId(), null);
        }

        assertEquals(5, applicationService.getActiveApplicationCount(applicant.getUserId()));

        // 6th application must be rejected with ApplicationLimitExceededException
        JobPosting sixthPosting = savePosting("Position 6", PostStatus.PUBLISHED, today.plusDays(10));
        assertThrows(ApplicationLimitExceededException.class, () ->
                applicationService.submitApplication(sixthPosting.getJobPostId(), applicant.getUserId(), null));
    }

    private JobPosting savePosting(String title, PostStatus status, LocalDate deadline) {
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
