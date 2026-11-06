package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.controller.dto.ApplicationDetailResponse;
import baylor.csi5324.careerbridge.controller.dto.ApplicationListResponse;
import baylor.csi5324.careerbridge.controller.dto.OfferDecisionResponse;
import baylor.csi5324.careerbridge.controller.dto.OfferResponse;
import baylor.csi5324.careerbridge.controller.dto.WithdrawalRequestResponse;
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
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
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

    // UC-05 Track Application Status

    @Test
    void viewsAllApplicationsOfTheApplicantWithActiveOnesFirstAndActiveCount() {
        Application ended = saveApplication("Closed Role", ApplicationStatus.REJECTED);
        Application activeOne = saveApplication("Active Role 1", ApplicationStatus.INTERVIEW);
        Application activeTwo = saveApplication("Active Role 2", ApplicationStatus.APPLIED);

        Applicant someoneElse = saveOtherApplicant("other@example.com");
        Application notMine = new Application(someoneElse,
                save("Other Role", PostStatus.PUBLISHED, today.plusDays(10)), RESUME, today);
        applicationRepository.saveAndFlush(notMine);

        ApplicationListResponse list = applicationService.viewApplications();

        assertEquals(2, list.activeApplicationCount());
        assertEquals(3, list.applications().size());
        assertEquals(activeOne.getApplicationId(), list.applications().get(0).applicationId());
        assertEquals(activeTwo.getApplicationId(), list.applications().get(1).applicationId());
        assertEquals(ended.getApplicationId(), list.applications().get(2).applicationId());
        assertTrue(list.applications().get(0).active());
        assertFalse(list.applications().get(2).active());
    }

    @Test
    void viewsApplicationDetailsWithStageHistoryAndInterviewsWithoutOutcomesOrNotes() {
        Application application = saveApplication("Backend Developer", ApplicationStatus.INTERVIEW);
        application.getStatusHistory().add(new StatusHistoryEntry(ApplicationStatus.SCREENING, today.minusDays(4)));
        application.getStatusHistory().add(new StatusHistoryEntry(ApplicationStatus.INTERVIEW, today.minusDays(1)));
        application.getInterviews().add(new Interview(
                LocalDateTime.of(today.plusDays(2), java.time.LocalTime.of(10, 30)),
                "Video call",
                "Meeting link sent by email",
                "Passed",
                "Private recruiter notes"));
        applicationRepository.saveAndFlush(application);

        ApplicationDetailResponse detail = applicationService.viewApplication(application.getApplicationId());

        assertEquals("Backend Developer", detail.title());
        assertEquals(ApplicationStatus.INTERVIEW, detail.applicationStatus());
        assertEquals(3, detail.statusHistory().size());
        assertEquals(1, detail.interviews().size());
        assertEquals("Video call", detail.interviews().get(0).format());
        assertEquals("Meeting link sent by email", detail.interviews().get(0).location());
        assertEquals(List.of("WITHDRAW"), detail.availableActions());
    }

    @Test
    void viewsRejectedApplicationWithRejectionDateStageAndReason() {
        Application application = saveApplication("Data Engineer", ApplicationStatus.REJECTED);
        application.getStatusHistory().add(new StatusHistoryEntry(ApplicationStatus.SCREENING, today.minusDays(3)));
        application.getStatusHistory().add(new StatusHistoryEntry(
                ApplicationStatus.REJECTED, today, "Position requires production Spark experience"));
        application.setRejectionReason("Position requires production Spark experience");
        applicationRepository.saveAndFlush(application);

        ApplicationDetailResponse detail = applicationService.viewApplication(application.getApplicationId());

        assertEquals(ApplicationStatus.REJECTED, detail.applicationStatus());
        assertEquals(ApplicationStatus.SCREENING, detail.rejectedAtStage());
        assertEquals(today, detail.rejectionDate());
        assertEquals("Position requires production Spark experience", detail.rejectionReason());
        assertTrue(detail.availableActions().isEmpty());
    }

    @Test
    void revealsNothingWhenAnApplicantAsksForAnotherApplicantsApplication() {
        Applicant someoneElse = saveOtherApplicant("intruder@example.com");
        Application otherApp = applicationRepository.saveAndFlush(new Application(
                someoneElse, save("Private Role", PostStatus.PUBLISHED, today.plusDays(10)), RESUME, today));

        assertThrows(ApplicationNotFoundException.class,
                () -> applicationService.viewApplication(otherApp.getApplicationId()));
    }

    // UC-06 Withdraw Application

    @Test
    void requestsWithdrawalWithPostingDetailsStageAndFinalWarning() {
        Application application = saveApplication("Cloud Engineer", ApplicationStatus.SCREENING);

        WithdrawalRequestResponse preview = applicationService.requestWithdrawal(application.getApplicationId());

        assertEquals("Cloud Engineer", preview.title());
        assertEquals("Test Organization", preview.organizationName());
        assertEquals(ApplicationStatus.SCREENING, preview.applicationStatus());
        assertTrue(preview.warning().contains("cannot apply to this posting again"));
    }

    @Test
    void withdrawsAnApplicationInAppliedScreeningOrInterviewAndFreesItsSlot() {
        Application application = saveApplication("Cloud Engineer", ApplicationStatus.INTERVIEW);

        ApplicationDetailResponse withdrawn = applicationService.withdrawApplication(
                application.getApplicationId(), "Accepted another offer");

        assertEquals(ApplicationStatus.WITHDRAWN, withdrawn.applicationStatus());
        assertEquals(0, withdrawn.activeApplicationCount());
        assertNotNull(withdrawn.withdrawnAt());
        assertEquals("Accepted another offer", withdrawn.withdrawalReason());
        assertTrue(withdrawn.availableActions().isEmpty());

        // Withdrawn applications stay on record and block re-applying (FR-UC06.9, A5)
        assertTrue(applicationRepository.findById(application.getApplicationId()).isPresent());
        assertThrows(ApplicationRefusedException.class,
                () -> applicationService.submitApplication(application.getJobPosting().getJobPostId(), RESUME));
    }

    @Test
    void refusesToWithdrawAnApplicationAtOfferOrTerminalStages() {
        Application atOffer = saveApplicationWithOffer("Offer Role", 1, today.plusDays(7));
        Application rejected = saveApplication("Rejected Role", ApplicationStatus.REJECTED);

        ApplicationRefusedException offerRefused = assertThrows(ApplicationRefusedException.class,
                () -> applicationService.withdrawApplication(atOffer.getApplicationId(), "No longer interested"));
        assertTrue(offerRefused.getMessage().contains("Offer stage"));

        assertThrows(ApplicationRefusedException.class,
                () -> applicationService.withdrawApplication(rejected.getApplicationId(), null));
    }

    // UC-07 Respond to Job Offer

    @Test
    void viewsOfferDetailsForAnApplicationAtTheOfferStage() {
        Application application = saveApplicationWithOffer("Platform Engineer", 2, today.plusDays(7));

        OfferResponse offer = applicationService.viewOffer(application.getApplicationId());

        assertEquals("Platform Engineer", offer.title());
        assertEquals("Test Organization", offer.organizationName());
        assertEquals("$95,000 per year", offer.salary());
        assertEquals(today.plusDays(7), offer.expirationDate());
        assertEquals(today.plusDays(30), offer.startDate());
        assertTrue(offer.open());
    }

    @Test
    void acceptsAnOpenOfferAndMovesTheApplicationToHired() {
        Application application = saveApplicationWithOffer("Platform Engineer", 2, today.plusDays(7));

        OfferDecisionResponse decision = applicationService.acceptOffer(application.getApplicationId());

        assertEquals(ApplicationStatus.HIRED, decision.applicationStatus());
        assertEquals(OfferStatus.ACCEPTED, decision.offerStatus());
        assertEquals(today, decision.responseDate());
        assertFalse(decision.postingClosed());
        assertEquals(0, decision.activeApplicationCount());
        assertEquals(PostStatus.PUBLISHED,
                jobPostingRepository.findById(application.getJobPosting().getJobPostId()).orElseThrow().getPostStatus());
    }

    @Test
    void closesThePostingAsFilledAndRejectsRemainingActiveApplicationsWhenLastOpeningIsAccepted() {
        Application offerApplication = saveApplicationWithOffer("Single Opening Role", 1, today.plusDays(7));
        JobPosting posting = offerApplication.getJobPosting();

        Applicant candidateTwo = saveOtherApplicant("candidate2@example.com");
        Application competingActive = new Application(candidateTwo, posting, RESUME, today.minusDays(5));
        competingActive.setApplicationStatus(ApplicationStatus.INTERVIEW);
        competingActive = applicationRepository.saveAndFlush(competingActive);

        Applicant candidateThree = saveOtherApplicant("candidate3@example.com");
        Application alreadyWithdrawn = new Application(candidateThree, posting, RESUME, today.minusDays(6));
        alreadyWithdrawn.setApplicationStatus(ApplicationStatus.WITHDRAWN);
        alreadyWithdrawn = applicationRepository.saveAndFlush(alreadyWithdrawn);

        OfferDecisionResponse decision = applicationService.acceptOffer(offerApplication.getApplicationId());

        assertTrue(decision.postingClosed());
        JobPosting reloadedPosting = jobPostingRepository.findById(posting.getJobPostId()).orElseThrow();
        assertEquals(PostStatus.CLOSED, reloadedPosting.getPostStatus());
        assertEquals("Filled", reloadedPosting.getCloseReason());
        assertNotNull(reloadedPosting.getClosedAt());

        Application rejectedCompetitor = applicationRepository.findById(competingActive.getApplicationId()).orElseThrow();
        assertEquals(ApplicationStatus.REJECTED, rejectedCompetitor.getApplicationStatus());
        assertEquals("Posting closed", rejectedCompetitor.getRejectionReason());

        Application untouchedWithdrawn = applicationRepository.findById(alreadyWithdrawn.getApplicationId()).orElseThrow();
        assertEquals(ApplicationStatus.WITHDRAWN, untouchedWithdrawn.getApplicationStatus());
    }

    @Test
    void declinesAnOfferWithOptionalReasonAndLeavesThePostingOpen() {
        Application application = saveApplicationWithOffer("Security Analyst", 1, today.plusDays(7));

        OfferDecisionResponse decision = applicationService.declineOffer(
                application.getApplicationId(), "Accepted another offer");

        assertEquals(ApplicationStatus.OFFER_DECLINED, decision.applicationStatus());
        assertEquals(OfferStatus.DECLINED, decision.offerStatus());
        assertFalse(decision.postingClosed());
        assertEquals(0, decision.activeApplicationCount());
        assertEquals(PostStatus.PUBLISHED,
                jobPostingRepository.findById(application.getJobPosting().getJobPostId()).orElseThrow().getPostStatus());
    }

    @Test
    void refusesOfferAcceptanceWhenDeadlinePassedOrTermsWereRevised() {
        Application expiredOffer = saveApplicationWithOffer("Expired Offer Role", 1, today.minusDays(1));
        assertThrows(ApplicationRefusedException.class,
                () -> applicationService.acceptOffer(expiredOffer.getApplicationId()));

        Application revisedOffer = saveApplicationWithOffer("Revised Offer Role", 1, today.plusDays(7));
        ApplicationRefusedException revisedRefusal = assertThrows(ApplicationRefusedException.class,
                () -> applicationService.acceptOffer(
                        revisedOffer.getApplicationId(), "$80,000 per year", today.plusDays(7)));
        assertTrue(revisedRefusal.getMessage().contains("revised this offer"));
    }

    private JobPosting save(String title, PostStatus status, LocalDate deadline) {
        return saveWithOpenings(title, status, deadline, 1);
    }

    private JobPosting saveWithOpenings(String title, PostStatus status, LocalDate deadline, int openings) {
        JobPosting posting = new JobPosting();
        posting.setOrganization(organization);
        posting.setTitle(title);
        posting.setLocation("Remote");
        posting.setEmploymentType("Full-time");
        posting.setNumberOfOpenings(openings);
        posting.setPostStatus(status);
        posting.setDatePosted(today);
        posting.setApplicationDeadline(deadline);
        return jobPostingRepository.save(posting);
    }

    private Application saveApplication(String title, ApplicationStatus status) {
        JobPosting posting = save(title, PostStatus.PUBLISHED, today.plusDays(14));
        Application application = new Application(applicant, posting, RESUME, today.minusDays(7));
        application.setApplicationStatus(status);
        return applicationRepository.saveAndFlush(application);
    }

    private Application saveApplicationWithOffer(String title, int openings, LocalDate offerExpiration) {
        JobPosting posting = saveWithOpenings(title, PostStatus.PUBLISHED, today.plusDays(14), openings);
        Application application = new Application(applicant, posting, RESUME, today.minusDays(10));
        application.setApplicationStatus(ApplicationStatus.OFFER);
        application.getStatusHistory().add(new StatusHistoryEntry(ApplicationStatus.OFFER, today.minusDays(1)));
        application.setOffer(new Offer(
                today.minusDays(1),
                offerExpiration,
                today.plusDays(30),
                "$95,000 per year",
                "Full medical and 401(k) match."));
        return applicationRepository.saveAndFlush(application);
    }

    private Applicant saveOtherApplicant(String email) {
        Applicant other = new Applicant();
        other.setFirstName("Alex");
        other.setLastName("Rivera");
        other.setEmail(email);
        other.setAccountStatus(AccountStatus.ACTIVE);
        return applicantRepository.saveAndFlush(other);
    }
}
