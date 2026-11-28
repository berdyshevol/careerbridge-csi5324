package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.lifecycle.LifecycleFixtures;
import baylor.csi5324.careerbridge.lifecycle.ApplicationLifecycle;
import baylor.csi5324.careerbridge.lifecycle.JobPostingLifecycle;
import baylor.csi5324.careerbridge.config.SampleDataLoader;
import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.Interview;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Offer;
import baylor.csi5324.careerbridge.model.OfferStatus;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.model.ResumeSnapshot;
import baylor.csi5324.careerbridge.model.StatusHistoryEntry;
import jakarta.persistence.EntityManager;
import baylor.csi5324.careerbridge.repository.ApplicantRepository;
import baylor.csi5324.careerbridge.repository.ApplicationRepository;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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
        long jordansBefore = applicationService.viewApplications(JORDAN).applications().size();

        applicationService.submitApplication(posting.getJobPostId(), "SAM.RIVERA@example.com");

        assertEquals(jordansBefore, applicationService.viewApplications(JORDAN).applications().size());
        Application sams = applicationService.viewApplications(SAM).applications().get(0);
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
        ApplicationLifecycle.restore(applicationRepository.findAll().get(0), ApplicationStatus.REJECTED);
        JobPosting sixth = save("Position 6", PostStatus.PUBLISHED, today.plusDays(10));

        ApplicationStart start = applicationService.startApplication(sixth.getJobPostId(), JORDAN);

        assertNull(start.refusal());
        assertEquals(ApplicationService.APPLICATION_LIMIT - 1, start.activeApplicationCount());
    }

    // SCRUM-266: the screen shows these up front instead of working them out in the browser
    @Test
    void startsOnAClosedPostingWithThatRefusalFirst() {
        JobPosting closed = save("Software Engineer", PostStatus.CLOSED, today.plusDays(14));
        JobPosting pastDeadline = save("Data Analyst", PostStatus.PUBLISHED, today.minusDays(1));

        assertEquals(ApplicationRefusal.POSTING_CLOSED,
                applicationService.startApplication(closed.getJobPostId(), JORDAN).refusal());
        assertEquals(ApplicationRefusal.POSTING_CLOSED,
                applicationService.startApplication(pastDeadline.getJobPostId(), JORDAN).refusal());
        // In submitApplication's order: a closed posting is named before the missing resume
        assertEquals(ApplicationRefusal.POSTING_CLOSED,
                applicationService.startApplication(closed.getJobPostId(), SAM).refusal());
    }

    @Test
    void startsOnAPostingAppliedToBeforeWithThatRefusal() {
        JobPosting posting = save("Software Engineer", PostStatus.PUBLISHED, today.plusDays(14));
        applicationService.submitApplication(posting.getJobPostId(), JORDAN);
        // Ended applications count too: a posting is applied to once (A5)
        LifecycleFixtures.withdrawn(applicationRepository.findAll().get(0), java.time.Instant.now());

        ApplicationStart start = applicationService.startApplication(posting.getJobPostId(), JORDAN);

        assertEquals(ApplicationRefusal.ALREADY_APPLIED, start.refusal());
        assertEquals(0, start.activeApplicationCount());
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
        ApplicationLifecycle.restore(ended, ApplicationStatus.REJECTED);
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
        ApplicationLifecycle.restore(applicationRepository.findAll().stream()
                .filter(a -> a.getJobPosting().getJobPostId().equals(ended.getJobPostId()))
                .findFirst().orElseThrow(), ApplicationStatus.WITHDRAWN);

        var result = applicationService.viewApplications(JORDAN);

        assertEquals(2, result.applications().size());
        assertEquals(1, result.activeApplicationCount());
        assertTrue(result.applications().stream().anyMatch(a -> a.getApplicationStatus() == ApplicationStatus.WITHDRAWN));
    }

    @Test
    void listsNothingWhenTheApplicantHasNotApplied() {
        var result = applicationService.viewApplications(JORDAN);

        assertTrue(result.applications().isEmpty());
        assertEquals(0, result.activeApplicationCount());
    }

    @Test
    void ordersActiveApplicationsBeforeClosedOnesAndTracksLastStageChangeDate() {
        JobPosting closedJob = save("Closed Job", PostStatus.PUBLISHED, today.plusDays(10));
        JobPosting activeJob = save("Active Job", PostStatus.PUBLISHED, today.plusDays(10));
        JobPosting newerActiveJob = save("Newer Active Job", PostStatus.PUBLISHED, today.plusDays(10));

        Application closed = applicationService.submitApplication(closedJob.getJobPostId(), JORDAN).application();
        ApplicationLifecycle.restore(closed, ApplicationStatus.REJECTED, today.plusDays(5));

        Application active = applicationService.submitApplication(activeJob.getJobPostId(), JORDAN).application();
        ApplicationLifecycle.restore(active, ApplicationStatus.SCREENING, today.plusDays(1));

        Application newerActive = applicationService.submitApplication(newerActiveJob.getJobPostId(), JORDAN).application();
        ApplicationLifecycle.restore(newerActive, ApplicationStatus.OFFER, today.plusDays(3));
        entityManager.flush();

        var result = applicationService.viewApplications(JORDAN);
        var applications = result.applications();

        assertEquals(3, applications.size());
        assertEquals(2, result.activeApplicationCount());
        assertEquals(ApplicationService.APPLICATION_LIMIT, result.applicationLimit());
        assertEquals("Newer Active Job", applications.get(0).getJobPosting().getTitle());
        assertEquals(today.plusDays(3), applications.get(0).getLastStageChangeDate());
        assertEquals("Active Job", applications.get(1).getJobPosting().getTitle());
        assertEquals(today.plusDays(1), applications.get(1).getLastStageChangeDate());
        assertEquals("Closed Job", applications.get(2).getJobPosting().getTitle());
        assertEquals(today.plusDays(5), applications.get(2).getLastStageChangeDate());
        assertEquals(ApplicationStatus.APPLIED, applications.get(2).getRejectedAtStage());
        assertEquals(today.plusDays(5), applications.get(2).getRejectionDate());
    }

    @Test
    void viewsOwnApplicationWithStageHistoryAndInterviews() {
        JobPosting posting = save("Data Analyst", PostStatus.PUBLISHED, today.plusDays(14));
        Application submitted = applicationService.submitApplication(posting.getJobPostId(), JORDAN).application();
        ApplicationLifecycle.restore(submitted, ApplicationStatus.INTERVIEW, today.plusDays(2), today.plusDays(5));
        Interview interview = new Interview(submitted, 1, today.plusDays(7).atTime(14, 0), "On-site", "1200 Austin Ave");
        interview.setOutcome("Passed");
        interview.setNotes("Strong SQL");
        submitted.getInterviews().add(interview);
        entityManager.flush();
        entityManager.clear();

        Application loaded = applicationService.viewApplication(submitted.getApplicationId(), JORDAN);

        assertEquals(3, loaded.getStatusHistory().size());
        assertEquals(1, loaded.getInterviews().size());
        assertEquals("On-site", loaded.getInterviews().get(0).getFormat());
        assertEquals(java.util.List.of("WITHDRAW"), ApplicationLifecycle.availableActions(loaded, java.time.Instant.now()));
    }

    @Test
    void refusesAnotherApplicantsApplicationAsNotFound() {
        JobPosting posting = save("Private Role", PostStatus.PUBLISHED, today.plusDays(14));
        Long id = applicationService.submitApplication(posting.getJobPostId(), JORDAN)
                .application().getApplicationId();

        assertThrows(ApplicationNotFoundException.class, () -> applicationService.viewApplication(id, SAM));
    }

    @Test
    void refusesUnknownApplicationIdAsNotFound() {
        assertThrows(ApplicationNotFoundException.class, () -> applicationService.viewApplication(-99L, JORDAN));
    }

    @Test
    void requestWithdrawalReturnsPostingStageAndFinalWarning() {
        JobPosting posting = save("QA Engineer", PostStatus.PUBLISHED, today.plusDays(14));
        Long id = applicationService.submitApplication(posting.getJobPostId(), JORDAN).application().getApplicationId();

        WithdrawalPrompt prompt = applicationService.requestWithdrawal(id, JORDAN);

        assertEquals("QA Engineer", prompt.application().getJobPosting().getTitle());
        assertEquals(ApplicationStatus.APPLIED, prompt.application().getApplicationStatus());
        assertTrue(prompt.warning().contains("final"));
        assertTrue(prompt.warning().contains("cannot reapply"));
        assertFalse(prompt.reasons().isEmpty());
    }

    @Test
    void withdrawsActiveApplicationFreesSlotRetainsAuditRecordAndStillBlocksReapply() {
        JobPosting posting = save("QA Engineer", PostStatus.PUBLISHED, today.plusDays(14));
        Long id = applicationService.submitApplication(posting.getJobPostId(), JORDAN).application().getApplicationId();

        WithdrawnApplication withdrawn = applicationService.withdrawApplication(id, JORDAN, "No longer interested");

        assertEquals(ApplicationStatus.WITHDRAWN, withdrawn.application().getApplicationStatus());
        assertEquals(0, withdrawn.activeApplicationCount());
        assertTrue(withdrawn.application().getWithdrawnAt() != null);

        // Verify withdrawnAt and StatusHistoryEntry.reason round-trip through JPA columns
        Application persisted = reloaded(id);
        assertEquals(ApplicationStatus.WITHDRAWN, persisted.getApplicationStatus());
        assertTrue(persisted.getWithdrawnAt() != null);
        var lastEntry = persisted.getStatusHistory().get(persisted.getStatusHistory().size() - 1);
        assertEquals(ApplicationStatus.WITHDRAWN, lastEntry.getStatus());
        assertEquals("No longer interested", lastEntry.getReason());
        // Record remains stored for audit (FR-UC06.9) and still blocks reapplying (A5)
        ApplicationRefusedException refused = assertThrows(ApplicationRefusedException.class,
                () -> applicationService.submitApplication(posting.getJobPostId(), JORDAN));
        assertEquals(ApplicationRefusal.ALREADY_APPLIED, refused.getReason());
    }

    @Test
    void withdrawsWithBlankReasonAsNullAndRefusesNonOwnerAccess() {
        JobPosting first = save("QA Engineer", PostStatus.PUBLISHED, today.plusDays(14));
        Long firstId = applicationService.submitApplication(first.getJobPostId(), JORDAN).application().getApplicationId();

        assertThrows(ApplicationNotFoundException.class, () -> applicationService.requestWithdrawal(firstId, SAM));
        assertThrows(ApplicationNotFoundException.class, () -> applicationService.withdrawApplication(firstId, SAM, "Nope"));
        assertEquals(ApplicationStatus.APPLIED, reloaded(firstId).getApplicationStatus());

        applicationService.withdrawApplication(firstId, JORDAN, "   ");
        Application persisted = reloaded(firstId);
        assertEquals(ApplicationStatus.WITHDRAWN, persisted.getApplicationStatus());
        assertEquals(null, persisted.getStatusHistory().get(persisted.getStatusHistory().size() - 1).getReason());
    }

    @Test
    void refusesWithdrawalAtOfferOrTerminalStagesWithoutChangingData() {
        JobPosting offerPosting = save("Offer Role", PostStatus.PUBLISHED, today.plusDays(14));
        Application offerApp = applicationService.submitApplication(offerPosting.getJobPostId(), JORDAN).application();
        ApplicationLifecycle.restore(offerApp, ApplicationStatus.OFFER);

        JobPosting rejectedPosting = save("Rejected Role", PostStatus.PUBLISHED, today.plusDays(14));
        Application rejectedApp = applicationService.submitApplication(rejectedPosting.getJobPostId(), JORDAN).application();
        ApplicationLifecycle.restore(rejectedApp, ApplicationStatus.REJECTED);
        entityManager.flush();

        assertThrows(ApplicationActionRefusedException.class,
                () -> applicationService.requestWithdrawal(offerApp.getApplicationId(), JORDAN));
        assertThrows(ApplicationActionRefusedException.class,
                () -> applicationService.requestWithdrawal(rejectedApp.getApplicationId(), JORDAN));

        ApplicationActionRefusedException offerRefused = assertThrows(ApplicationActionRefusedException.class,
                () -> applicationService.withdrawApplication(offerApp.getApplicationId(), JORDAN, null));
        assertEquals(ApplicationStatus.OFFER, offerRefused.getCurrentStage());
        assertEquals(ApplicationStatus.OFFER, offerApp.getApplicationStatus());

        ApplicationActionRefusedException terminalRefused = assertThrows(ApplicationActionRefusedException.class,
                () -> applicationService.withdrawApplication(rejectedApp.getApplicationId(), JORDAN, null));
        assertEquals(ApplicationStatus.REJECTED, terminalRefused.getCurrentStage());
        assertEquals(ApplicationStatus.REJECTED, rejectedApp.getApplicationStatus());
    }

    @Test
    void viewsAndAcceptsOpenOfferMovingApplicationToHiredAndFreeingSlot() {
        JobPosting posting = save("Data Analyst", PostStatus.PUBLISHED, today.plusDays(14));
        Application offered = submitWithOffer(posting, today.plusDays(7));
        Long id = offered.getApplicationId();

        Application viewed = applicationService.viewOffer(id, JORDAN);
        assertEquals("68,000 USD per year", viewed.getOffer().getSalary());
        assertThrows(ApplicationNotFoundException.class, () -> applicationService.viewOffer(id, SAM));

        OfferResponseResult accepted = applicationService.acceptOffer(id, JORDAN, 1);
        assertEquals(ApplicationStatus.HIRED, accepted.application().getApplicationStatus());
        assertEquals(0, accepted.activeApplicationCount());

        Application persisted = reloaded(id);
        assertEquals(ApplicationStatus.HIRED, persisted.getApplicationStatus());
        assertEquals(OfferStatus.ACCEPTED, persisted.getOffer().getStatus());
        assertEquals(LocalDate.ofInstant(accepted.respondedAt(), organization.getZoneId()),
                persisted.getOffer().getResponseDate());
        assertEquals(ApplicationStatus.HIRED,
                persisted.getStatusHistory().get(persisted.getStatusHistory().size() - 1).getStatus());
    }

    @Test
    void declinesOpenOfferWithReasonFreesSlotAndLeavesPostingOpen() {
        JobPosting posting = save("Product Analyst", PostStatus.PUBLISHED, today.plusDays(14));
        Application offered = submitWithOffer(posting, today.plusDays(7));
        Long id = offered.getApplicationId();

        OfferResponseResult declined = applicationService.declineOffer(id, JORDAN, "Accepted another role", 1);
        assertEquals(ApplicationStatus.OFFER_DECLINED, declined.application().getApplicationStatus());
        assertEquals(0, declined.activeApplicationCount());

        Application persisted = reloaded(id);
        assertEquals(ApplicationStatus.OFFER_DECLINED, persisted.getApplicationStatus());
        assertEquals(OfferStatus.DECLINED, persisted.getOffer().getStatus());
        assertEquals(LocalDate.ofInstant(declined.respondedAt(), organization.getZoneId()),
                persisted.getOffer().getResponseDate());
        var lastEntry = persisted.getStatusHistory().get(persisted.getStatusHistory().size() - 1);
        assertEquals(ApplicationStatus.OFFER_DECLINED, lastEntry.getStatus());
        assertEquals("Accepted another role", lastEntry.getReason());
        assertEquals(PostStatus.PUBLISHED, jobPostingRepository.findById(posting.getJobPostId()).orElseThrow().getPostStatus());
    }

    @Test
    void refusesExpiredRevisedClosedAndNonOwnerOfferResponsesWithoutChangingData() {
        JobPosting expiredPosting = save("Expired Offer Role", PostStatus.PUBLISHED, today.plusDays(14));
        Application expiredApp = submitWithOffer(expiredPosting, today.minusDays(1));
        assertThrows(ApplicationActionRefusedException.class,
                () -> applicationService.acceptOffer(expiredApp.getApplicationId(), JORDAN, 1));
        assertEquals(ApplicationStatus.OFFER, reloaded(expiredApp.getApplicationId()).getApplicationStatus());

        JobPosting revisedPosting = save("Revised Offer Role", PostStatus.PUBLISHED, today.plusDays(14));
        Application revisedApp = submitWithOffer(revisedPosting, today.plusDays(7));
        LifecycleFixtures.revised(revisedApp.getOffer(), "75,000 USD per year");
        entityManager.flush();

        OfferRevisedException revised = assertThrows(OfferRevisedException.class,
                () -> applicationService.acceptOffer(revisedApp.getApplicationId(), JORDAN, 1));
        assertEquals(2, revised.getOffer().getRevision());
        assertEquals("75,000 USD per year", revised.getOffer().getSalary());
        assertEquals(ApplicationStatus.OFFER, reloaded(revisedApp.getApplicationId()).getApplicationStatus());
        assertThrows(ApplicationNotFoundException.class,
                () -> applicationService.acceptOffer(revisedApp.getApplicationId(), SAM, 2));

        JobPosting closedPosting = save("Closed Offer Role", PostStatus.PUBLISHED, today.plusDays(14));
        Application closedApp = submitWithOffer(closedPosting, today.plusDays(7));
        LifecycleFixtures.closed(closedPosting, JobPostingLifecycle.Event.FILL_POSTING, java.time.Instant.now());
        entityManager.flush();
        assertThrows(ApplicationActionRefusedException.class,
                () -> applicationService.acceptOffer(closedApp.getApplicationId(), JORDAN, 1));
        assertEquals(ApplicationStatus.OFFER, reloaded(closedApp.getApplicationId()).getApplicationStatus());
    }

    @Test
    void closesSingleOpeningPostingWhenFilledAndRejectsRemainingActiveApplications() {
        JobPosting posting = save("Senior Engineer", PostStatus.PUBLISHED, today.plusDays(14));
        posting.setNumberOfOpenings(1);
        jobPostingRepository.save(posting);

        Applicant third = new Applicant();
        third.setFirstName("Alex");
        third.setLastName("Chen");
        third.setEmail("alex.chen@example.com");
        third.setAccountStatus(AccountStatus.ACTIVE);
        applicantRepository.save(third);
        upload(SAM, "sam.pdf", "%PDF-1.4\nbody".getBytes());
        upload("alex.chen@example.com", "alex.pdf", "%PDF-1.4\nbody".getBytes());

        Application jordanOffer = submitWithOffer(posting, today.plusDays(7));
        Application samOffer = submitWithOfferFor(posting, SAM, today.plusDays(7));
        Application alexApplied = applicationService.submitApplication(posting.getJobPostId(), "alex.chen@example.com")
                .application();
        entityManager.flush();

        OfferResponseResult accepted = applicationService.acceptOffer(jordanOffer.getApplicationId(), JORDAN, 1);
        assertEquals(ApplicationStatus.HIRED, accepted.application().getApplicationStatus());

        JobPosting reloadedPosting = jobPostingRepository.findById(posting.getJobPostId()).orElseThrow();
        assertEquals(PostStatus.CLOSED, reloadedPosting.getPostStatus());
        assertEquals("Filled", reloadedPosting.getClosingReason());
        assertTrue(reloadedPosting.getClosedAt() != null);

        // Other active applications are rejected with "Posting closed", freeing their active slots (FR-UC07.7, A3, BR-4)
        Application samAfter = reloaded(samOffer.getApplicationId());
        assertEquals(ApplicationStatus.REJECTED, samAfter.getApplicationStatus());
        assertEquals("Posting closed", samAfter.getRejectionReason());
        assertEquals(OfferStatus.RESCINDED, samAfter.getOffer().getStatus());
        assertEquals(0, applicationService.viewApplications(SAM).activeApplicationCount());

        Application alexAfter = reloaded(alexApplied.getApplicationId());
        assertEquals(ApplicationStatus.REJECTED, alexAfter.getApplicationStatus());
        assertEquals("Posting closed", alexAfter.getRejectionReason());
        assertEquals(0, applicationService.viewApplications("alex.chen@example.com").activeApplicationCount());

        // Second applicant can no longer accept their rescinded offer (ext 6a)
        assertThrows(ApplicationActionRefusedException.class,
                () -> applicationService.acceptOffer(samOffer.getApplicationId(), SAM, 1));

        // Posting no longer accepts new applications once filled (FR-UC07.7, BR-10)
        Applicant fourth = new Applicant();
        fourth.setFirstName("Morgan");
        fourth.setLastName("Patel");
        fourth.setEmail("morgan.patel@example.com");
        fourth.setAccountStatus(AccountStatus.ACTIVE);
        applicantRepository.save(fourth);
        upload("morgan.patel@example.com", "morgan.pdf", "%PDF-1.4\nbody".getBytes());
        ApplicationRefusedException closedApply = assertThrows(ApplicationRefusedException.class,
                () -> applicationService.submitApplication(posting.getJobPostId(), "morgan.patel@example.com"));
        assertEquals(ApplicationRefusal.POSTING_CLOSED, closedApply.getReason());
    }

    @Test
    void keepsMultiOpeningPostingOpenUntilLastOpeningIsFilled() {
        JobPosting posting = save("Support Specialist", PostStatus.PUBLISHED, today.plusDays(14));
        posting.setNumberOfOpenings(2);
        jobPostingRepository.save(posting);

        Applicant third = new Applicant();
        third.setFirstName("Taylor");
        third.setLastName("Brooks");
        third.setEmail("taylor.brooks@example.com");
        third.setAccountStatus(AccountStatus.ACTIVE);
        applicantRepository.save(third);
        upload(SAM, "sam.pdf", "%PDF-1.4\nbody".getBytes());
        upload("taylor.brooks@example.com", "taylor.pdf", "%PDF-1.4\nbody".getBytes());

        Application jordanOffer = submitWithOffer(posting, today.plusDays(7));
        Application samOffer = submitWithOfferFor(posting, SAM, today.plusDays(7));
        Application taylorActive = applicationService.submitApplication(posting.getJobPostId(), "taylor.brooks@example.com")
                .application();
        entityManager.flush();

        // First hire leaves 1 opening remaining: posting stays PUBLISHED and other applications stay active
        applicationService.acceptOffer(jordanOffer.getApplicationId(), JORDAN, 1);
        assertEquals(PostStatus.PUBLISHED, jobPostingRepository.findById(posting.getJobPostId()).orElseThrow().getPostStatus());
        assertEquals(ApplicationStatus.OFFER, reloaded(samOffer.getApplicationId()).getApplicationStatus());
        assertEquals(ApplicationStatus.APPLIED, reloaded(taylorActive.getApplicationId()).getApplicationStatus());

        // Second hire fills the last opening: posting closes as Filled and remaining active applicant is rejected
        applicationService.acceptOffer(samOffer.getApplicationId(), SAM, 1);
        JobPosting closed = jobPostingRepository.findById(posting.getJobPostId()).orElseThrow();
        assertEquals(PostStatus.CLOSED, closed.getPostStatus());
        assertEquals("Filled", closed.getClosingReason());
        Application taylorAfter = reloaded(taylorActive.getApplicationId());
        assertEquals(ApplicationStatus.REJECTED, taylorAfter.getApplicationStatus());
        assertEquals("Posting closed", taylorAfter.getRejectionReason());
    }

    private Application submitWithOffer(JobPosting posting, LocalDate expirationDate) {
        return submitWithOfferFor(posting, JORDAN, expirationDate);
    }

    private Application submitWithOfferFor(JobPosting posting, String email, LocalDate expirationDate) {
        Application application = applicationService.submitApplication(posting.getJobPostId(), email).application();
        ApplicationLifecycle.restore(application, ApplicationStatus.OFFER, today);
        application.setOffer(new Offer(
                application,
                today,
                today.plusDays(30),
                "68,000 USD per year",
                "Hybrid after 90 days.",
                expirationDate,
                "Offer_Letter.pdf"));
        entityManager.flush();
        return application;
    }

    private void upload(String email, String fileName, byte[] content) {
        applicantProfileService.uploadResume(email, fileName, "application/pdf", content);
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
        JobPostingLifecycle.restore(posting, status);
        posting.setDatePosted(today);
        posting.setApplicationDeadline(deadline);
        return jobPostingRepository.save(posting);
    }
}
