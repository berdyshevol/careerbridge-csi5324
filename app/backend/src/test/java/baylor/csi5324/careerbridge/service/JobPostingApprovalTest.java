
package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.config.SampleDataLoader;
import baylor.csi5324.careerbridge.dto.CreateJobPostingRequest;
import baylor.csi5324.careerbridge.dto.PostingSearchCriteria;
import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.OrganizationStatus;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.model.Recruiter;
import baylor.csi5324.careerbridge.repository.ApplicationRepository;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import baylor.csi5324.careerbridge.repository.RecruiterRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class JobPostingApprovalTest {

    @Autowired
    private JobPostingService jobPostingService;

    @Autowired
    private JobPostingRepository jobPostingRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private RecruiterRepository recruiterRepository;

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private ApplicantProfileService applicantProfileService;

    // Seeded by DemoUsers
    private static final String OWNER = "riley.chen@example.com";

    private Organization organization;
    private Recruiter owner;

    @BeforeEach
    void setUp() {
        applicationRepository.deleteAll();
        jobPostingRepository.deleteAll();

        // Riley is an Active member of Brazos Analytics and Waco Health Partners (DemoUsers)
        organization = organizationRepository.findByName("Waco Health Partners").orElseThrow();
        owner = recruiterRepository.findByEmailIgnoreCase(OWNER).orElseThrow();
    }

    @Test
    void anotherRecruiterCannotSubmitThePosting() {
        JobPosting draft = createPosting(PostStatus.DRAFT, LocalDate.now().plusDays(10));
        Recruiter other = new Recruiter();
        other.setFirstName("Sam");
        other.setLastName("Ortiz");
        other.setEmail("other@example.com");
        other.setAccountStatus(AccountStatus.ACTIVE);
        recruiterRepository.save(other);

        assertThrows(PostingNotAllowedException.class,
                () -> jobPostingService.submitJobPosting(draft.getJobPostId(), "other@example.com"));
        assertEquals(PostStatus.DRAFT,
                jobPostingRepository.findById(draft.getJobPostId()).orElseThrow().getPostStatus());
    }

    @Test
    void theRecruiterClosesTheirPublishedPosting() {
        JobPosting published = createPosting(PostStatus.PUBLISHED, LocalDate.now().plusDays(10));

        JobPosting closed = jobPostingService.closePosting(published.getJobPostId(), OWNER);

        assertEquals(PostStatus.CLOSED, closed.getPostStatus());
        assertEquals(JobPostingService.CLOSED_BY_RECRUITER, closed.getClosingReason());
        assertNotNull(closed.getClosedAt());
        assertTrue(jobPostingService.searchPostings(PostingSearchCriteria.ANY).stream()
                .noneMatch(posting -> posting.getJobPostId().equals(published.getJobPostId())));
    }

    @Test
    void closingKeepsTheApplicationsAndRefusesNewOnes() {
        JobPosting published = createPosting(PostStatus.PUBLISHED, LocalDate.now().plusDays(10));
        String jordan = SampleDataLoader.SAMPLE_APPLICANT_EMAIL;
        applicantProfileService.uploadResume(jordan, "cv.pdf", "application/pdf",
                "%PDF-1.4 cv".getBytes(StandardCharsets.ISO_8859_1));
        Long applicationId = applicationService.submitApplication(published.getJobPostId(), jordan)
                .application().getApplicationId();

        jobPostingService.closePosting(published.getJobPostId(), OWNER);

        assertEquals(ApplicationStatus.APPLIED,
                applicationRepository.findById(applicationId).orElseThrow().getApplicationStatus());
        assertThrows(ApplicationRefusedException.class,
                () -> applicationService.submitApplication(published.getJobPostId(), "sam.rivera@example.com"));
    }

    @Test
    void anotherRecruiterCannotCloseThePosting() {
        JobPosting published = createPosting(PostStatus.PUBLISHED, LocalDate.now().plusDays(10));

        assertThrows(PostingNotAllowedException.class,
                () -> jobPostingService.closePosting(published.getJobPostId(), "other@example.com"));
        assertEquals(PostStatus.PUBLISHED,
                jobPostingRepository.findById(published.getJobPostId()).orElseThrow().getPostStatus());
    }

    @Test
    void onlyAPublishedPostingCanBeClosed() {
        JobPosting draft = createPosting(PostStatus.DRAFT, LocalDate.now().plusDays(10));
        JobPosting published = createPosting(PostStatus.PUBLISHED, LocalDate.now().plusDays(10));
        jobPostingService.closePosting(published.getJobPostId(), OWNER);

        assertThrows(PostingStateConflictException.class,
                () -> jobPostingService.closePosting(draft.getJobPostId(), OWNER));
        // Closing twice does nothing more: the first close stands
        assertThrows(PostingStateConflictException.class,
                () -> jobPostingService.closePosting(published.getJobPostId(), OWNER));
        assertEquals(PostStatus.DRAFT,
                jobPostingRepository.findById(draft.getJobPostId()).orElseThrow().getPostStatus());
    }

    @Test
    void aPostingPastItsDeadlineIsLeftToExpire() {
        JobPosting overdue = createPosting(PostStatus.PUBLISHED, LocalDate.now().minusDays(2));

        assertThrows(PostingStateConflictException.class,
                () -> jobPostingService.closePosting(overdue.getJobPostId(), OWNER));
        assertEquals(PostStatus.PUBLISHED,
                jobPostingRepository.findById(overdue.getJobPostId()).orElseThrow().getPostStatus());
    }

    @Test
    void aPostingNoRecruiterCreatedCannotBeSubmitted() {
        JobPosting sample = createPosting(PostStatus.DRAFT, LocalDate.now().plusDays(10));
        sample.setRecruiter(null);
        jobPostingRepository.save(sample);

        assertThrows(PostingNotAllowedException.class,
                () -> jobPostingService.submitJobPosting(sample.getJobPostId(), OWNER));
    }

    @Test
    void draftCanBeSubmittedForApproval() {
        JobPosting draft = createPosting(
                PostStatus.DRAFT, LocalDate.now().plusDays(10));

        JobPosting result =
                jobPostingService.submitJobPosting(draft.getJobPostId(), OWNER);

        assertEquals(PostStatus.PENDING_APPROVAL,
                result.getPostStatus());
    }

    @Test
    void returnedPostingCanBeResubmitted() {
        JobPosting returned = createPosting(
                PostStatus.RETURNED, LocalDate.now().plusDays(10));

        JobPosting result =
                jobPostingService.submitJobPosting(returned.getJobPostId(), OWNER);

        assertEquals(PostStatus.PENDING_APPROVAL,
                result.getPostStatus());
    }

    @Test
    void pendingPostingCanBeApproved() {
        JobPosting pending = createPosting(
                PostStatus.PENDING_APPROVAL, LocalDate.now().plusDays(10));

        JobPosting approved = jobPostingService.approveJobPosting(
                pending.getJobPostId(), "Test Administrator", "Approved");

        assertEquals(PostStatus.PUBLISHED, approved.getPostStatus());
        assertEquals("Test Administrator", approved.getApprovedBy());
        assertNotNull(approved.getApprovedAt());
        assertEquals("Approved", approved.getReviewComment());
    }

    @Test
    void approvedPostingAppearsInPublicSearch() {
        JobPosting pending = createPosting(
                PostStatus.PENDING_APPROVAL, LocalDate.now().plusDays(10));

        jobPostingService.approveJobPosting(
                pending.getJobPostId(), "Test Administrator", null);

        assertTrue(jobPostingService.searchPostings(PostingSearchCriteria.ANY).stream()
                .anyMatch(posting ->
                        posting.getJobPostId().equals(pending.getJobPostId())));
    }

    @Test
    void pendingPostingCanBeReturnedForCorrections() {
        JobPosting pending = createPosting(
                PostStatus.PENDING_APPROVAL, LocalDate.now().plusDays(10));

        JobPosting returned = jobPostingService.returnJobPosting(
                pending.getJobPostId(),
                "Test Administrator",
                "Please clarify the job requirements");

        assertEquals(PostStatus.RETURNED, returned.getPostStatus());
        assertEquals("Please clarify the job requirements",
                returned.getReviewComment());
        assertNotNull(returned.getApprovedAt());
    }

    @Test
    void pendingPostingCanBeRejected() {
        JobPosting pending = createPosting(
                PostStatus.PENDING_APPROVAL, LocalDate.now().plusDays(10));

        JobPosting rejected = jobPostingService.rejectJobPosting(
                pending.getJobPostId(),
                "Test Administrator",
                "Posting does not meet requirements");

        assertEquals(PostStatus.REJECTED, rejected.getPostStatus());
        assertEquals("Test Administrator", rejected.getApprovedBy());
    }

    @Test
    void publishedPostingCannotBeApprovedAgain() {
        JobPosting published = createPosting(
                PostStatus.PUBLISHED, LocalDate.now().plusDays(10));

        assertThrows(PostingStateConflictException.class,
                () -> jobPostingService.approveJobPosting(
                        published.getJobPostId(), "Admin", "Approved"));
    }

    @Test
    void rejectedPostingCannotBeResubmitted() {
        JobPosting rejected = createPosting(
                PostStatus.REJECTED, LocalDate.now().plusDays(10));

        assertThrows(PostingStateConflictException.class,
                () -> jobPostingService.submitJobPosting(rejected.getJobPostId(), OWNER));
    }

    @Test
    void pastDeadlineReturnsThePostingForANewDeadline() {
        JobPosting pending = createPosting(
                PostStatus.PENDING_APPROVAL, LocalDate.now().minusDays(1));

        JobPosting result = jobPostingService.approveJobPosting(
                pending.getJobPostId(), "Admin", "Approved");

        assertEquals(PostStatus.RETURNED, result.getPostStatus());
        assertEquals(JobPostingService.DEADLINE_PASSED, result.getReviewComment());
        assertEquals("Admin", result.getApprovedBy());
    }

    @Test
    void approvalRecordsThePublicationDate() {
        JobPosting pending = createPosting(
                PostStatus.PENDING_APPROVAL, LocalDate.now().plusDays(10));
        pending.setDatePosted(LocalDate.now().minusDays(30));

        JobPosting approved = jobPostingService.approveJobPosting(
                pending.getJobPostId(), "Admin", null);

        assertEquals(LocalDate.now(), approved.getDatePosted());
    }

    @Test
    void deadlineMustBeBetweenOneAndNinetyDaysAway() {
        JobPosting today = createPosting(PostStatus.DRAFT, LocalDate.now());
        JobPosting tooFar = createPosting(PostStatus.DRAFT, LocalDate.now().plusDays(91));
        JobPosting lastDay = createPosting(PostStatus.DRAFT, LocalDate.now().plusDays(90));

        assertThrows(InvalidPostingException.class,
                () -> jobPostingService.submitJobPosting(today.getJobPostId(), OWNER));
        assertThrows(InvalidPostingException.class,
                () -> jobPostingService.submitJobPosting(tooFar.getJobPostId(), OWNER));
        assertEquals(PostStatus.PENDING_APPROVAL,
                jobPostingService.submitJobPosting(lastDay.getJobPostId(), OWNER).getPostStatus());
    }

    @Test
    void pendingListIsOldestFirst() {
        JobPosting newer = createPosting(
                PostStatus.PENDING_APPROVAL, LocalDate.now().plusDays(10));
        JobPosting older = createPosting(
                PostStatus.PENDING_APPROVAL, LocalDate.now().plusDays(10));
        older.setDatePosted(LocalDate.now().minusDays(5));

        List<JobPosting> results = jobPostingService.openPostingApprovalQueue();

        assertEquals(List.of(older.getJobPostId(), newer.getJobPostId()),
                results.stream().map(JobPosting::getJobPostId).toList());
    }

    @Test
    void rejectionRequiresAReason() {
        JobPosting pending = createPosting(
                PostStatus.PENDING_APPROVAL, LocalDate.now().plusDays(10));

        assertThrows(InvalidPostingException.class,
                () -> jobPostingService.rejectJobPosting(
                        pending.getJobPostId(), "Admin", " "));
    }

    @Test
    void pendingListExcludesDraftsAndPublishedPostings() {
        JobPosting pending = createPosting(
                PostStatus.PENDING_APPROVAL, LocalDate.now().plusDays(10));

        createPosting(PostStatus.DRAFT, LocalDate.now().plusDays(10));
        createPosting(PostStatus.PUBLISHED, LocalDate.now().plusDays(10));

        List<JobPosting> results = jobPostingService.openPostingApprovalQueue();

        assertEquals(1, results.size());
        assertEquals(pending.getJobPostId(),
                results.get(0).getJobPostId());
    }

    @Test
    void resubmittingClearsPreviousReviewInformation() {
        JobPosting returned = createPosting(
                PostStatus.RETURNED, LocalDate.now().plusDays(10));

        returned.setApprovedBy("Previous Administrator");
        returned.setReviewComment("Needs corrections");

        JobPosting result =
                jobPostingService.submitJobPosting(returned.getJobPostId(), OWNER);

        assertEquals(PostStatus.PENDING_APPROVAL,
                result.getPostStatus());
        assertNull(result.getApprovedBy());
        assertNull(result.getApprovedAt());
        assertNull(result.getReviewComment());
    }

    @Test
    void aDraftIsReopenedAndChangedByItsRecruiter() {
        JobPosting draft = createPosting(PostStatus.DRAFT, LocalDate.now().plusDays(10));

        assertEquals(draft.getJobPostId(), jobPostingService.openPostingForEdit(draft.getJobPostId(), OWNER).getJobPostId());
        jobPostingService.updatePosting(draft.getJobPostId(), details("Senior Software Engineer"), OWNER);

        JobPosting saved = jobPostingRepository.findById(draft.getJobPostId()).orElseThrow();
        assertEquals("Senior Software Engineer", saved.getTitle());
        assertEquals("Remote", saved.getLocation());
        assertEquals(3, saved.getNumberOfOpenings());
        assertEquals(PostStatus.DRAFT, saved.getPostStatus());
        assertEquals(organization.getOrganizationId(), saved.getOrganization().getOrganizationId());
    }

    @Test
    void aReturnedPostingKeepsItsCommentUntilItIsSubmittedAgain() {
        JobPosting returned = createPosting(PostStatus.RETURNED, LocalDate.now().plusDays(10));
        returned.setReviewComment("Add the salary range");
        jobPostingRepository.save(returned);

        assertEquals("Add the salary range",
                jobPostingService.openPostingForEdit(returned.getJobPostId(), OWNER).getReviewComment());
        JobPosting changed = jobPostingService.updatePosting(returned.getJobPostId(), details("Software Engineer"), OWNER);
        assertEquals(PostStatus.RETURNED, changed.getPostStatus());
        assertEquals("Add the salary range", changed.getReviewComment());

        JobPosting submitted = jobPostingService.submitJobPosting(returned.getJobPostId(), OWNER);
        assertEquals(PostStatus.PENDING_APPROVAL, submitted.getPostStatus());
        assertNull(submitted.getReviewComment());
    }

    @Test
    void anotherRecruiterCannotOpenOrChangeThePosting() {
        JobPosting draft = createPosting(PostStatus.DRAFT, LocalDate.now().plusDays(10));

        assertThrows(PostingNotAllowedException.class,
                () -> jobPostingService.openPostingForEdit(draft.getJobPostId(), "other@example.com"));
        assertThrows(PostingNotAllowedException.class,
                () -> jobPostingService.updatePosting(draft.getJobPostId(), details("Taken over"), "other@example.com"));
        assertEquals("Software Engineer",
                jobPostingRepository.findById(draft.getJobPostId()).orElseThrow().getTitle());
    }

    @Test
    void onlyADraftOrAReturnedPostingCanBeChanged() {
        JobPosting published = createPosting(PostStatus.PUBLISHED, LocalDate.now().plusDays(10));
        JobPosting pending = createPosting(PostStatus.PENDING_APPROVAL, LocalDate.now().plusDays(10));

        assertThrows(PostingStateConflictException.class,
                () -> jobPostingService.openPostingForEdit(published.getJobPostId(), OWNER));
        assertThrows(PostingStateConflictException.class,
                () -> jobPostingService.updatePosting(pending.getJobPostId(), details("Changed"), OWNER));
    }

    @Test
    void anInvalidChangeIsRefusedAndNothingChanges() {
        JobPosting draft = createPosting(PostStatus.DRAFT, LocalDate.now().plusDays(10));

        InvalidPostingException refused = assertThrows(InvalidPostingException.class,
                () -> jobPostingService.updatePosting(draft.getJobPostId(), details(" "), OWNER));
        assertEquals("Job title is required", refused.getMessage());
        assertEquals("Software Engineer",
                jobPostingRepository.findById(draft.getJobPostId()).orElseThrow().getTitle());
    }

    @Test
    void aRecruiterActsOnlyForTheOrganizationTheyAreAMemberOf() {
        Organization logistics = organizationRepository.findByName("Lone Star Logistics").orElseThrow();
        CreateJobPostingRequest forLogistics = new CreateJobPostingRequest(logistics.getOrganizationId(), "Analyst",
                "", "", "Remote", "Full-time", null, 1, LocalDate.now().plusDays(20));
        JobPosting draft = createPosting(PostStatus.DRAFT, LocalDate.now().plusDays(10));
        draft.setOrganization(logistics);
        jobPostingRepository.save(draft);
        JobPosting published = createPosting(PostStatus.PUBLISHED, LocalDate.now().plusDays(10));
        published.setOrganization(logistics);
        jobPostingRepository.save(published);

        assertThrows(PostingNotAllowedException.class, () -> jobPostingService.createPosting(forLogistics, OWNER));
        assertThrows(PostingNotAllowedException.class, () -> jobPostingService.submitJobPosting(draft.getJobPostId(), OWNER));
        assertThrows(PostingNotAllowedException.class, () -> jobPostingService.openPostingForEdit(draft.getJobPostId(), OWNER));
        assertThrows(PostingNotAllowedException.class, () -> jobPostingService.closePosting(published.getJobPostId(), OWNER));
        assertEquals(PostStatus.DRAFT, jobPostingRepository.findById(draft.getJobPostId()).orElseThrow().getPostStatus());
    }

    @Test
    void anInactiveOrganizationsPostingStaysPending() {
        JobPosting pending = createPosting(PostStatus.PENDING_APPROVAL, LocalDate.now().plusDays(10));
        organization.setOrganizationStatus(OrganizationStatus.INACTIVE);
        organizationRepository.save(organization);

        assertThrows(PostingStateConflictException.class,
                () -> jobPostingService.approveJobPosting(pending.getJobPostId(), "Test Administrator", null));
        assertEquals(PostStatus.PENDING_APPROVAL,
                jobPostingRepository.findById(pending.getJobPostId()).orElseThrow().getPostStatus());
    }

    @Test
    void aPostingOfARecruiterNoLongerActiveStaysPending() {
        Recruiter gone = new Recruiter();
        gone.setFirstName("Lee");
        gone.setLastName("Huang");
        gone.setEmail("lee.huang@example.com");
        gone.setAccountStatus(AccountStatus.PENDING_VERIFICATION);
        recruiterRepository.save(gone);
        JobPosting pending = createPosting(PostStatus.PENDING_APPROVAL, LocalDate.now().plusDays(10));
        pending.setRecruiter(gone);
        jobPostingRepository.save(pending);

        assertThrows(PostingStateConflictException.class,
                () -> jobPostingService.approveJobPosting(pending.getJobPostId(), "Test Administrator", null));
        assertEquals(PostStatus.PENDING_APPROVAL,
                jobPostingRepository.findById(pending.getJobPostId()).orElseThrow().getPostStatus());
    }

    private CreateJobPostingRequest details(String title) {
        return new CreateJobPostingRequest(organization.getOrganizationId(), title, "Build and maintain applications",
                "Java and Spring Boot", "Remote", "Full-time", null, 3, LocalDate.now().plusDays(20));
    }

    private JobPosting createPosting(
            PostStatus status, LocalDate deadline) {

        JobPosting posting = new JobPosting();

        posting.setTitle("Software Engineer");
        posting.setDescription("Build and maintain applications");
        posting.setJobRequirements("Java and Spring Boot");
        posting.setLocation("Waco, TX");
        posting.setEmploymentType("Full-time");
        posting.setNumberOfOpenings(1);
        posting.setDatePosted(LocalDate.now());
        posting.setApplicationDeadline(deadline);
        posting.setPostStatus(status);
        posting.setOrganization(organization);
        posting.setRecruiter(owner);

        return jobPostingRepository.save(posting);
    }

}
