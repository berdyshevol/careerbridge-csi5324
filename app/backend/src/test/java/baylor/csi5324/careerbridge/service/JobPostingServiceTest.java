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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

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
        organization = organizationRepository.save(new Organization("Test Organization"));
    }

    @Test
    void searchPostingsReturnsOnlyOpenPostingsNewestFirst() {
        save("Older", PostStatus.PUBLISHED, today.minusDays(5), today.plusDays(10));
        save("Newer", PostStatus.PUBLISHED, today.minusDays(1), today.plusDays(10));
        save("Deadline passed", PostStatus.PUBLISHED, today.minusDays(30), today.minusDays(1));
        save("Draft", PostStatus.DRAFT, today, today.plusDays(10));
        save("Pending", PostStatus.PENDING_APPROVAL, today, today.plusDays(10));
        save("Closed", PostStatus.CLOSED, today.minusDays(40), today.plusDays(10));

        List<String> titles = jobPostingService.searchPostings(null).stream().map(JobPosting::getTitle).toList();

        assertEquals(List.of("Newer", "Older"), titles);
    }

    @Test
    void searchPostingsMatchesKeywordIgnoringCase() {
        save("Backend Developer", PostStatus.PUBLISHED, today, today.plusDays(10));
        save("Data Analyst", PostStatus.PUBLISHED, today, today.plusDays(10));

        List<JobPosting> found = jobPostingService.searchPostings("  DEVELOPER ");

        assertEquals(1, found.size());
        assertEquals("Backend Developer", found.get(0).getTitle());
    }

    @Test
    void viewPostingReturnsAClosedPostingThatWasPublished() {
        JobPosting closed = save("Closed", PostStatus.CLOSED, today.minusDays(40), today.minusDays(10));

        assertEquals("Closed", jobPostingService.viewPosting(closed.getJobPostId()).getTitle());
    }

    @Test
    void viewPostingHidesPostingsThatWereNeverPublished() {
        JobPosting draft = save("Draft", PostStatus.DRAFT, today, today.plusDays(10));

        assertThrows(PostingNotFoundException.class, () -> jobPostingService.viewPosting(draft.getJobPostId()));
    }

    @Test
    void viewPostingRejectsAnUnknownId() {
        assertThrows(PostingNotFoundException.class, () -> jobPostingService.viewPosting(-1L));
    }

    private JobPosting save(String title, PostStatus status, LocalDate datePosted, LocalDate deadline) {
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
