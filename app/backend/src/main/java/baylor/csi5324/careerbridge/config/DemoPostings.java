package baylor.csi5324.careerbridge.config;

import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.model.Recruiter;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import baylor.csi5324.careerbridge.repository.RecruiterRepository;
import baylor.csi5324.careerbridge.service.JobPostingService;
import baylor.csi5324.careerbridge.service.RecruiterOrganization;
import baylor.csi5324.careerbridge.util.CsvReader;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

// A posting in every status for each demo recruiter, so their Postings page shows the whole life of a
// posting. Unlike data/jobs.csv this runs on every start, because the live database is never empty;
// a posting whose title the organization already has is left as it is (SCRUM-228)
@Component
@Order(3) // after DemoUsers, which creates the recruiters and their memberships
public class DemoPostings implements CommandLineRunner {

    private static final String FILE = "data/demo-postings.csv";
    static final String APPROVED_BY = "admin@careerbridge.example";
    // Far enough ahead that the demo postings do not expire before the course ends
    private static final int DAYS_OPEN = 90;

    private final JobPostingRepository jobPostingRepository;
    private final RecruiterRepository recruiterRepository;
    private final RecruiterOrganization recruiterOrganization;
    private final Clock clock;
    private final boolean enabled;

    public DemoPostings(JobPostingRepository jobPostingRepository, RecruiterRepository recruiterRepository,
                        RecruiterOrganization recruiterOrganization, Clock clock,
                        @Value("${careerbridge.demo.postings:true}") boolean enabled) {
        this.jobPostingRepository = jobPostingRepository;
        this.recruiterRepository = recruiterRepository;
        this.recruiterOrganization = recruiterOrganization;
        this.clock = clock;
        this.enabled = enabled;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (!enabled) {
            return;
        }
        String csv = new ClassPathResource(FILE).getContentAsString(StandardCharsets.UTF_8);
        for (Map<String, String> record : CsvReader.parse(csv)) {
            String email = record.get("recruiterEmail");
            // No account (its password is not set) or no Active membership: nowhere to put the posting
            Optional<Recruiter> recruiter = recruiterRepository.findByEmailIgnoreCase(email);
            Optional<Organization> organization = recruiterOrganization.activeOrganizationOf(email);
            if (recruiter.isEmpty() || organization.isEmpty() || jobPostingRepository.existsByOrganizationAndTitleIgnoreCase(organization.get(), record.get("title"))) {
                continue;
            }
            jobPostingRepository.save(toPosting(record, recruiter.get(), organization.get()));
        }
    }

    private JobPosting toPosting(Map<String, String> record, Recruiter recruiter, Organization organization) {
        LocalDate today = LocalDate.now(clock);
        JobPosting posting = new JobPosting();
        posting.setOrganization(organization);
        posting.setRecruiter(recruiter);
        posting.setTitle(record.get("title"));
        posting.setDescription(record.get("description"));
        posting.setJobRequirements(record.get("jobRequirements"));
        posting.setLocation(record.get("location"));
        posting.setEmploymentType(record.get("employmentType"));
        posting.setSalaryRange(record.get("salaryRange").isBlank() ? null : record.get("salaryRange"));
        posting.setNumberOfOpenings(1);
        posting.setDatePosted(today);
        posting.setApplicationDeadline(today.plusDays(DAYS_OPEN));
        PostStatus status = PostStatus.fromLabel(record.get("postStatus"));
        posting.setPostStatus(status);
        if (status == PostStatus.RETURNED) {
            posting.setReviewComment(record.get("reviewComment"));
        }
        if (status == PostStatus.PUBLISHED || status == PostStatus.CLOSED) {
            posting.setApprovedBy(APPROVED_BY);
            posting.setApprovedAt(LocalDateTime.now(clock));
        }
        if (status == PostStatus.CLOSED) {
            posting.close(JobPostingService.CLOSED_BY_RECRUITER, clock.instant());
        }
        return posting;
    }
}
