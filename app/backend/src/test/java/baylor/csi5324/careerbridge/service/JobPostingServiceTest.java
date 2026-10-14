
package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.dto.CreateJobPostingRequest;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
class JobPostingServiceTest {

    @Autowired
    private JobPostingService jobPostingService;

    @Autowired
    private JobPostingRepository jobPostingRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    private final LocalDate today = LocalDate.now();
    private Organization organization;

    @BeforeEach
    void replaceSampleData() {
        jobPostingRepository.deleteAll();
        organization = organizationRepository.save(
                new Organization("Test Organization"));
    }

    @Test
    void searchPostingsReturnsOnlyOpenPostingsNewestFirst() {
        save("Older", PostStatus.PUBLISHED, today.minusDays(5), today.plusDays(10));
        save("Newer", PostStatus.PUBLISHED, today.minusDays(1), today.plusDays(10));
        save("Deadline passed", PostStatus.PUBLISHED, today.minusDays(30), today.minusDays(1));
        save("Draft", PostStatus.DRAFT, today, today.plusDays(10));
        save("Pending", PostStatus.PENDING_APPROVAL, today, today.plusDays(10));
        save("Closed", PostStatus.CLOSED, today.minusDays(40), today.plusDays(10));

        List<String> titles = jobPostingService.searchPostings(null)
                .stream()
                .map(JobPosting::getTitle)
                .toList();

        assertEquals(List.of("Newer", "Older"), titles);
    }

    @Test
    void searchPostingsMatchesKeywordIgnoringCase() {
        save("Backend Developer", PostStatus.PUBLISHED, today, today.plusDays(10));
        save("Data Analyst", PostStatus.PUBLISHED, today, today.plusDays(10));

        List<JobPosting> found =
                jobPostingService.searchPostings("  DEVELOPER ");

        assertEquals(1, found.size());
        assertEquals("Backend Developer", found.get(0).getTitle());
    }

    @Test
    void viewPostingReturnsAClosedPostingThatWasPublished() {
        JobPosting closed = save(
                "Closed", PostStatus.CLOSED,
                today.minusDays(40), today.minusDays(10));

        assertEquals(
                "Closed",
                jobPostingService.viewPosting(closed.getJobPostId()).getTitle());
    }

    @Test
    void viewPostingHidesPostingsThatWereNeverPublished() {
        JobPosting draft = save(
                "Draft", PostStatus.DRAFT, today, today.plusDays(10));

        assertThrows(
                PostingNotFoundException.class,
                () -> jobPostingService.viewPosting(draft.getJobPostId()));
    }

    @Test
    void viewPostingRejectsAnUnknownId() {
        assertThrows(
                PostingNotFoundException.class,
                () -> jobPostingService.viewPosting(-1L));
    }

    @Test
    void createPostingSavesDraftWithCorrectOrganization() {
        CreateJobPostingRequest request = validRequest();

        JobPosting created = jobPostingService.createPosting(request);

        assertNotNull(created.getJobPostId());
        assertEquals("Cybersecurity Analyst", created.getTitle());
        assertEquals(PostStatus.DRAFT, created.getPostStatus());
        assertEquals(organization.getOrganizationId(),
                created.getOrganization().getOrganizationId());
        assertEquals(2, created.getNumberOfOpenings());
        assertEquals(today, created.getDatePosted());

        JobPosting saved = jobPostingRepository
                .findById(created.getJobPostId())
                .orElseThrow();

        assertEquals("Cybersecurity Analyst", saved.getTitle());
        assertEquals(PostStatus.DRAFT, saved.getPostStatus());
    }

    @Test
    void newlyCreatedDraftIsHiddenFromPublicSearch() {
        JobPosting created =
                jobPostingService.createPosting(validRequest());

        assertFalse(jobPostingService.searchPostings(null)
                .stream()
                .anyMatch(posting ->
                        posting.getJobPostId().equals(created.getJobPostId())));

        assertThrows(
                PostingNotFoundException.class,
                () -> jobPostingService.viewPosting(created.getJobPostId()));
    }

    @Test
    void createPostingRejectsBlankTitle() {
        CreateJobPostingRequest request = new CreateJobPostingRequest(
                organization.getOrganizationId(),
                "   ",
                "Monitor security alerts",
                "Cybersecurity knowledge",
                "Waco, TX",
                "Full-time",
                "$65,000 - $80,000",
                2,
                today.plusDays(30)
        );

        InvalidPostingException rejected = assertThrows(
                InvalidPostingException.class,
                () -> jobPostingService.createPosting(request));

        assertEquals("Job title is required", rejected.getMessage());
    }

    @Test
    void createPostingRejectsPastDeadline() {
        CreateJobPostingRequest request = new CreateJobPostingRequest(
                organization.getOrganizationId(),
                "Cybersecurity Analyst",
                "Monitor security alerts",
                "Cybersecurity knowledge",
                "Waco, TX",
                "Full-time",
                "$65,000 - $80,000",
                2,
                today.minusDays(1)
        );

        InvalidPostingException rejected = assertThrows(
                InvalidPostingException.class,
                () -> jobPostingService.createPosting(request));

        assertEquals("Application deadline must be today or later", rejected.getMessage());
    }

    @Test
    void createPostingRejectsUnknownOrganization() {
        CreateJobPostingRequest request = new CreateJobPostingRequest(
                -1L,
                "Cybersecurity Analyst",
                "Monitor security alerts",
                "Cybersecurity knowledge",
                "Waco, TX",
                "Full-time",
                "$65,000 - $80,000",
                2,
                today.plusDays(30)
        );

        InvalidPostingException rejected = assertThrows(
                InvalidPostingException.class,
                () -> jobPostingService.createPosting(request));

        assertEquals("Organization not found", rejected.getMessage());

        assertTrue(jobPostingRepository.findAll().isEmpty());
    }

    @Test
    void createPostingRejectsTextTooLongForItsColumn() {
        CreateJobPostingRequest request = new CreateJobPostingRequest(
                organization.getOrganizationId(),
                "Cybersecurity Analyst",
                "Monitor security alerts",
                "Cybersecurity knowledge",
                "W".repeat(256),
                "Full-time",
                "$65,000 - $80,000",
                2,
                today.plusDays(30)
        );

        InvalidPostingException rejected = assertThrows(
                InvalidPostingException.class,
                () -> jobPostingService.createPosting(request));

        assertEquals("Location is too long", rejected.getMessage());
    }

    private CreateJobPostingRequest validRequest() {
        return new CreateJobPostingRequest(
                organization.getOrganizationId(),
                "Cybersecurity Analyst",
                "Monitor security alerts",
                "Cybersecurity knowledge",
                "Waco, TX",
                "Full-time",
                "$65,000 - $80,000",
                2,
                today.plusDays(30)
        );
    }

    private JobPosting save(
            String title,
            PostStatus status,
            LocalDate datePosted,
            LocalDate deadline) {

        JobPosting posting = new JobPosting();
        posting.setOrganization(organization);
        posting.setTitle(title);
        posting.setLocation("Remote");
        posting.setPostStatus(status);
        posting.setDatePosted(datePosted);
        posting.setApplicationDeadline(deadline);

        return jobPostingRepository.save(posting);
    }
}

