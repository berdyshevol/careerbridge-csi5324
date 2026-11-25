
package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.dto.PostingSearchCriteria;
import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Organization;
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

    // Seeded by DemoUsers
    private static final String OWNER = "riley.chen@example.com";

    private Organization organization;
    private Recruiter owner;

    @BeforeEach
    void setUp() {
        applicationRepository.deleteAll();
        jobPostingRepository.deleteAll();

        organization = organizationRepository.save(
                new Organization("UC12 Test Organization"));
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
