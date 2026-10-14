
package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;

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
    private OrganizationRepository organizationRepository;

    private Organization organization;

    @BeforeEach
    void setUp() {
        jobPostingRepository.deleteAll();

        organization = organizationRepository.save(
                new Organization("UC12 Test Organization"));
    }

    @Test
    void draftCanBeSubmittedForApproval() {
        JobPosting draft = createPosting(
                PostStatus.DRAFT, LocalDate.now().plusDays(10));

        JobPosting result =
                jobPostingService.submitForApproval(draft.getJobPostId());

        assertEquals(PostStatus.PENDING_APPROVAL,
                result.getPostStatus());
    }

    @Test
    void returnedPostingCanBeResubmitted() {
        JobPosting returned = createPosting(
                PostStatus.RETURNED, LocalDate.now().plusDays(10));

        JobPosting result =
                jobPostingService.submitForApproval(returned.getJobPostId());

        assertEquals(PostStatus.PENDING_APPROVAL,
                result.getPostStatus());
    }

    @Test
    void pendingPostingCanBeApproved() {
        JobPosting pending = createPosting(
                PostStatus.PENDING_APPROVAL, LocalDate.now().plusDays(10));

        JobPosting approved = jobPostingService.approvePosting(
                pending.getJobPostId(), "Test Administrator", "Approved");

        assertEquals(PostStatus.PUBLISHED, approved.getPostStatus());
        assertEquals("Test Administrator", approved.getReviewedBy());
        assertNotNull(approved.getReviewedAt());
        assertEquals("Approved", approved.getReviewComment());
    }

    @Test
    void approvedPostingAppearsInPublicSearch() {
        JobPosting pending = createPosting(
                PostStatus.PENDING_APPROVAL, LocalDate.now().plusDays(10));

        jobPostingService.approvePosting(
                pending.getJobPostId(), "Test Administrator", null);

        assertTrue(jobPostingService.searchPostings(null).stream()
                .anyMatch(posting ->
                        posting.getJobPostId().equals(pending.getJobPostId())));
    }

    @Test
    void pendingPostingCanBeReturnedForCorrections() {
        JobPosting pending = createPosting(
                PostStatus.PENDING_APPROVAL, LocalDate.now().plusDays(10));

        JobPosting returned = jobPostingService.returnPosting(
                pending.getJobPostId(),
                "Test Administrator",
                "Please clarify the job requirements");

        assertEquals(PostStatus.RETURNED, returned.getPostStatus());
        assertEquals("Please clarify the job requirements",
                returned.getReviewComment());
        assertNotNull(returned.getReviewedAt());
    }

    @Test
    void pendingPostingCanBeRejected() {
        JobPosting pending = createPosting(
                PostStatus.PENDING_APPROVAL, LocalDate.now().plusDays(10));

        JobPosting rejected = jobPostingService.rejectPosting(
                pending.getJobPostId(),
                "Test Administrator",
                "Posting does not meet requirements");

        assertEquals(PostStatus.REJECTED, rejected.getPostStatus());
        assertEquals("Test Administrator", rejected.getReviewedBy());
    }

    @Test
    void publishedPostingCannotBeApprovedAgain() {
        JobPosting published = createPosting(
                PostStatus.PUBLISHED, LocalDate.now().plusDays(10));

        assertThrows(IllegalStateException.class,
                () -> jobPostingService.approvePosting(
                        published.getJobPostId(), "Admin", "Approved"));
    }

    @Test
    void rejectedPostingCannotBeResubmitted() {
        JobPosting rejected = createPosting(
                PostStatus.REJECTED, LocalDate.now().plusDays(10));

        assertThrows(IllegalStateException.class,
                () -> jobPostingService.submitForApproval(
                        rejected.getJobPostId()));
    }

    @Test
    void pastDeadlineCannotBeApproved() {
        JobPosting pending = createPosting(
                PostStatus.PENDING_APPROVAL, LocalDate.now().minusDays(1));

        assertThrows(IllegalStateException.class,
                () -> jobPostingService.approvePosting(
                        pending.getJobPostId(), "Admin", "Approved"));
    }

    @Test
    void rejectionRequiresAReason() {
        JobPosting pending = createPosting(
                PostStatus.PENDING_APPROVAL, LocalDate.now().plusDays(10));

        assertThrows(IllegalArgumentException.class,
                () -> jobPostingService.rejectPosting(
                        pending.getJobPostId(), "Admin", " "));
    }

    @Test
    void pendingListExcludesDraftsAndPublishedPostings() {
        JobPosting pending = createPosting(
                PostStatus.PENDING_APPROVAL, LocalDate.now().plusDays(10));

        createPosting(PostStatus.DRAFT, LocalDate.now().plusDays(10));
        createPosting(PostStatus.PUBLISHED, LocalDate.now().plusDays(10));

        List<JobPosting> results = jobPostingService.getPendingPostings();

        assertEquals(1, results.size());
        assertEquals(pending.getJobPostId(),
                results.get(0).getJobPostId());
    }

    @Test
    void resubmittingClearsPreviousReviewInformation() {
        JobPosting returned = createPosting(
                PostStatus.RETURNED, LocalDate.now().plusDays(10));

        returned.setReviewedBy("Previous Administrator");
        returned.setReviewComment("Needs corrections");

        JobPosting result =
                jobPostingService.submitForApproval(returned.getJobPostId());

        assertEquals(PostStatus.PENDING_APPROVAL,
                result.getPostStatus());
        assertNull(result.getReviewedBy());
        assertNull(result.getReviewedAt());
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

        return jobPostingRepository.save(posting);
    }
}
