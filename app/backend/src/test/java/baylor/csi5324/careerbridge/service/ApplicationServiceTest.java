package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.config.SampleDataLoader;
import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.model.ResumeSnapshot;
import jakarta.persistence.EntityManager;
import baylor.csi5324.careerbridge.repository.ApplicantRepository;
import baylor.csi5324.careerbridge.repository.ApplicationRepository;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
class ApplicationServiceTest {

    private static final String JORDAN = SampleDataLoader.SAMPLE_APPLICANT_EMAIL;
    private static final String SAM = "sam.rivera@example.com"; // a demo applicant with no resume on file

    private static final byte[] CV = "%PDF-1.4 cv".getBytes(StandardCharsets.ISO_8859_1);

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private ApplicantProfileService applicantProfileService;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private EntityManager entityManager;

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
        applicant = applicantRepository.findByEmailIgnoreCase(JORDAN).orElseThrow();
        upload(JORDAN, "cv.pdf", CV);
    }

    @Test
    void actsForTheApplicantWhoIsLoggedInAndNobodyElse() {
        JobPosting posting = save("Platform Engineer", PostStatus.PUBLISHED, today.plusDays(14));
        Applicant sam = applicantRepository.findByEmailIgnoreCase(SAM).orElseThrow();
        upload(SAM, "sam.pdf", "%PDF-1.4 sam".getBytes(StandardCharsets.ISO_8859_1));
        long jordansBefore = applicationService.viewApplications(JORDAN).size();

        applicationService.submitApplication(posting.getJobPostId(), "SAM.RIVERA@example.com");

        assertEquals(jordansBefore, applicationService.viewApplications(JORDAN).size());
        Application sams = applicationService.viewApplications(SAM).get(0);
        assertEquals(sam.getUserId(), sams.getApplicant().getUserId());
        assertEquals("sam.pdf", sams.getResumeSnapshot().getFileName());
        // Jordan can still apply to it: the rule is one application per applicant and posting (A5)
        applicationService.submitApplication(posting.getJobPostId(), JORDAN);
    }

    @Test
    void anAccountThatNoLongerExistsEndsTheSession() {
        assertThrows(AccountGoneException.class, () -> applicationService.viewApplications("gone@example.com"));
    }

    @Test
    void createsTheApplicationAtAppliedWithACopyOfTheResume() {
        JobPosting posting = save("Software Engineer", PostStatus.PUBLISHED, today.plusDays(14));

        SubmittedApplication submitted = applicationService.submitApplication(posting.getJobPostId(), JORDAN);

        Application application = applicationRepository.findById(
                submitted.application().getApplicationId()).orElseThrow();
        assertEquals(applicant.getUserId(), application.getApplicant().getUserId());
        assertEquals(ApplicationStatus.APPLIED, application.getApplicationStatus());
        // The date the organization sees, not the server's, since the two can differ near midnight
        assertEquals(LocalDate.now(organization.getZoneId()), application.getDateApplied());
        assertEquals(ApplicationStatus.APPLIED, application.getStatusHistory().get(0).getStatus());
        assertEquals(1, submitted.activeApplicationCount());
    }

    @Test
    void theSnapshotIsACopyOfTheResumeOnFileInItsFormat() {
        JobPosting posting = save("Software Engineer", PostStatus.PUBLISHED, today.plusDays(14));

        Long id = applicationService.submitApplication(posting.getJobPostId(), JORDAN).application().getApplicationId();

        ResumeSnapshot snapshot = reloaded(id).getResumeSnapshot();
        assertEquals("cv.pdf", snapshot.getFileName());
        assertEquals("application/pdf", snapshot.getFileType());
        assertEquals(CV.length, snapshot.getFileSize());
        assertArrayEquals(CV, snapshot.getContent());
    }

    @Test
    void replacingTheResumeLeavesTheSubmittedSnapshotAsItWas() {
        JobPosting posting = save("Software Engineer", PostStatus.PUBLISHED, today.plusDays(14));
        Long id = applicationService.submitApplication(posting.getJobPostId(), JORDAN).application().getApplicationId();

        upload(JORDAN, "new.pdf", "%PDF-1.4 a newer resume".getBytes(StandardCharsets.ISO_8859_1));

        ResumeSnapshot snapshot = reloaded(id).getResumeSnapshot();
        assertEquals("cv.pdf", snapshot.getFileName());
        assertArrayEquals(CV, snapshot.getContent());
        assertEquals("new.pdf", applicantRepository.findByEmailIgnoreCase(JORDAN).orElseThrow()
                .getResume().getFileName());
    }

    @Test
    void startsWithTheSummaryAndChangesNothing() {
        JobPosting posting = save("Software Engineer", PostStatus.PUBLISHED, today.plusDays(14));
        JobPosting other = save("DevOps Specialist", PostStatus.PUBLISHED, today.plusDays(14));
        applicationService.submitApplication(other.getJobPostId(), JORDAN);

        ApplicationStart start = applicationService.startApplication(posting.getJobPostId(), JORDAN);

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

        ApplicationStart start = applicationService.startApplication(posting.getJobPostId(), SAM);

        assertEquals(ApplicationRefusal.NO_RESUME, start.refusal());
        assertNull(start.resume());
        assertEquals("Software Engineer", start.posting().getTitle());
        assertEquals(SAM, start.applicant().getEmail());
    }

    @Test
    void startsAtTheLimitOfFiveWithTheActiveApplicationsListed() {
        for (int i = 1; i <= ApplicationService.APPLICATION_LIMIT; i++) {
            JobPosting posting = save("Position " + i, PostStatus.PUBLISHED, today.plusDays(10));
            applicationService.submitApplication(posting.getJobPostId(), JORDAN);
        }
        JobPosting sixth = save("Position 6", PostStatus.PUBLISHED, today.plusDays(10));

        ApplicationStart start = applicationService.startApplication(sixth.getJobPostId(), JORDAN);

        assertEquals(ApplicationRefusal.LIMIT_REACHED, start.refusal());
        assertEquals(ApplicationService.APPLICATION_LIMIT, start.activeApplicationCount());
        assertEquals(ApplicationService.APPLICATION_LIMIT, start.activeApplications().size());
    }

    @Test
    void startsBelowTheLimitWhenAnEndedApplicationFreedItsSlot() {
        for (int i = 1; i <= ApplicationService.APPLICATION_LIMIT; i++) {
            JobPosting posting = save("Position " + i, PostStatus.PUBLISHED, today.plusDays(10));
            applicationService.submitApplication(posting.getJobPostId(), JORDAN);
        }
        applicationRepository.findAll().get(0).setApplicationStatus(ApplicationStatus.REJECTED);
        JobPosting sixth = save("Position 6", PostStatus.PUBLISHED, today.plusDays(10));

        ApplicationStart start = applicationService.startApplication(sixth.getJobPostId(), JORDAN);

        assertNull(start.refusal());
        assertEquals(ApplicationService.APPLICATION_LIMIT - 1, start.activeApplicationCount());
    }

    @Test
    void startingOnAPostingThatDoesNotExistFails() {
        assertThrows(PostingNotFoundException.class,
                () -> applicationService.startApplication(-1L, JORDAN));
    }

    @Test
    void refusesAPostingThatIsNotOpen() {
        JobPosting closed = save("Closed", PostStatus.CLOSED, today.plusDays(10));
        JobPosting expired = save("Expired", PostStatus.PUBLISHED, today.minusDays(1));
        JobPosting draft = save("Draft", PostStatus.DRAFT, today.plusDays(10));
        JobPosting noDeadline = save("No deadline", PostStatus.PUBLISHED, null);

        for (JobPosting posting : new JobPosting[] {closed, expired, draft, noDeadline}) {
            ApplicationRefusedException refused = assertThrows(ApplicationRefusedException.class,
                    () -> applicationService.submitApplication(posting.getJobPostId(), JORDAN));
            assertEquals("This posting no longer accepts applications.", refused.getMessage());
            assertEquals(ApplicationRefusal.POSTING_CLOSED, refused.getReason());
        }
        assertEquals(0, applicationRepository.count());
    }

    @Test
    void refusesWithoutAResume() {
        JobPosting posting = save("Software Engineer", PostStatus.PUBLISHED, today.plusDays(14));

        ApplicationRefusedException refused = assertThrows(ApplicationRefusedException.class,
                () -> applicationService.submitApplication(posting.getJobPostId(), SAM));

        assertTrue(refused.getMessage().startsWith("A resume is required"));
        assertEquals(ApplicationRefusal.NO_RESUME, refused.getReason());
        assertEquals(0, applicationRepository.count());
    }

    @Test
    void refusesASecondApplicationToTheSamePosting() {
        JobPosting posting = save("DevOps Specialist", PostStatus.PUBLISHED, today.plusDays(14));
        applicationService.submitApplication(posting.getJobPostId(), JORDAN);

        ApplicationRefusedException refused = assertThrows(ApplicationRefusedException.class,
                () -> applicationService.submitApplication(posting.getJobPostId(), JORDAN));
        assertEquals(ApplicationRefusal.ALREADY_APPLIED, refused.getReason());
        assertEquals(1, applicationRepository.count());
    }

    @Test
    void refusesASixthActiveApplication() {
        for (int i = 1; i <= ApplicationService.APPLICATION_LIMIT; i++) {
            JobPosting posting = save("Position " + i, PostStatus.PUBLISHED, today.plusDays(10));
            applicationService.submitApplication(posting.getJobPostId(), JORDAN);
        }
        JobPosting sixth = save("Position 6", PostStatus.PUBLISHED, today.plusDays(10));

        ApplicationRefusedException refused = assertThrows(ApplicationRefusedException.class,
                () -> applicationService.submitApplication(sixth.getJobPostId(), JORDAN));
        assertEquals(ApplicationRefusal.LIMIT_REACHED, refused.getReason());
        assertEquals(ApplicationService.APPLICATION_LIMIT, applicationRepository.count());
    }

    @Test
    void anEndedApplicationFreesItsSlot() {
        for (int i = 1; i <= ApplicationService.APPLICATION_LIMIT; i++) {
            JobPosting posting = save("Position " + i, PostStatus.PUBLISHED, today.plusDays(10));
            applicationService.submitApplication(posting.getJobPostId(), JORDAN);
        }
        Application ended = applicationRepository.findAll().get(0);
        ended.setApplicationStatus(ApplicationStatus.REJECTED);
        JobPosting sixth = save("Position 6", PostStatus.PUBLISHED, today.plusDays(10));

        SubmittedApplication submitted = applicationService.submitApplication(sixth.getJobPostId(), JORDAN);

        assertEquals(ApplicationService.APPLICATION_LIMIT, submitted.activeApplicationCount());
    }

    @Test
    void listsEndedApplicationsTooSinceTheyStillBlockTheirPosting() {
        JobPosting kept = save("Kept", PostStatus.PUBLISHED, today.plusDays(10));
        JobPosting ended = save("Ended", PostStatus.PUBLISHED, today.plusDays(10));
        applicationService.submitApplication(kept.getJobPostId(), JORDAN);
        applicationService.submitApplication(ended.getJobPostId(), JORDAN);
        applicationRepository.findAll().stream()
                .filter(a -> a.getJobPosting().getJobPostId().equals(ended.getJobPostId()))
                .findFirst().orElseThrow().setApplicationStatus(ApplicationStatus.WITHDRAWN);

        var applications = applicationService.viewApplications(JORDAN);

        assertEquals(2, applications.size());
        assertTrue(applications.stream().anyMatch(a -> a.getApplicationStatus() == ApplicationStatus.WITHDRAWN));
    }

    @Test
    void listsNothingWhenTheApplicantHasNotApplied() {
        assertTrue(applicationService.viewApplications(JORDAN).isEmpty());
    }

    private void upload(String email, String fileName, byte[] content) {
        applicantProfileService.uploadResume(email, new MockMultipartFile("file", fileName, "application/pdf", content));
    }

    // From the database itself, so the snapshot went through its columns
    private Application reloaded(Long applicationId) {
        entityManager.flush();
        entityManager.clear();
        return applicationRepository.findById(applicationId).orElseThrow();
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
