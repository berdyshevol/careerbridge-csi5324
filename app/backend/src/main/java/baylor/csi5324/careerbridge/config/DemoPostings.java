package baylor.csi5324.careerbridge.config;

import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.model.Recruiter;
import baylor.csi5324.careerbridge.model.ResumeSnapshot;
import baylor.csi5324.careerbridge.repository.ApplicantRepository;
import baylor.csi5324.careerbridge.repository.ApplicationRepository;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import baylor.csi5324.careerbridge.repository.RecruiterRepository;
import baylor.csi5324.careerbridge.service.ApplicationService;
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
import java.util.List;
import java.util.Map;
import java.util.Optional;

// A posting in every status for each demo recruiter, so their Postings page shows the whole life of a
// posting, and two demo applicants on each published one, so screening has someone to screen. Unlike
// data/jobs.csv this runs on every start, because the live database is never empty; a posting whose title
// the organization already has, and an application already there, are left as they are (SCRUM-228, 233)
@Component
@Order(3) // after DemoUsers, which creates the recruiters and their memberships
public class DemoPostings implements CommandLineRunner {

    private static final String FILE = "data/demo-postings.csv";
    static final String APPROVED_BY = "admin@careerbridge.example";
    // Far enough ahead that the demo postings do not expire before the course ends
    private static final int DAYS_OPEN = 90;

    // Applicants of their own, so the demo log-ins (Sam Rivera, applicant1 to 3) keep their slots free for a
    // live demo. They have no password: they only need to show up in a recruiter's screening
    static final List<String[]> APPLICANTS = List.of(
            new String[] {"Casey", "Nguyen", "casey.nguyen@example.com"},
            new String[] {"Devon", "Patel", "devon.patel@example.com"},
            new String[] {"Alex", "Kim", "alex.kim@example.com"},
            new String[] {"Jamie", "Ortiz", "jamie.ortiz@example.com"});
    private static final ResumeSnapshot DEMO_RESUME = new ResumeSnapshot("Resume.pdf", "application/pdf", 120_000L);

    private final JobPostingRepository jobPostingRepository;
    private final RecruiterRepository recruiterRepository;
    private final ApplicantRepository applicantRepository;
    private final ApplicationRepository applicationRepository;
    private final RecruiterOrganization recruiterOrganization;
    private final Clock clock;
    private final boolean enabled;

    public DemoPostings(JobPostingRepository jobPostingRepository, RecruiterRepository recruiterRepository,
                        ApplicantRepository applicantRepository, ApplicationRepository applicationRepository,
                        RecruiterOrganization recruiterOrganization, Clock clock,
                        @Value("${careerbridge.demo.postings:true}") boolean enabled) {
        this.jobPostingRepository = jobPostingRepository;
        this.recruiterRepository = recruiterRepository;
        this.applicantRepository = applicantRepository;
        this.applicationRepository = applicationRepository;
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
        List<Applicant> applicants = APPLICANTS.stream().map(this::applicant).toList();
        int published = 0;
        for (Map<String, String> record : CsvReader.parse(csv)) {
            String email = record.get("recruiterEmail");
            // No account (its password is not set) or no Active membership: nowhere to put the posting
            Optional<Recruiter> recruiter = recruiterRepository.findByEmailIgnoreCase(email);
            Optional<Organization> organization = recruiterOrganization.activeOrganizationOf(email);
            if (recruiter.isEmpty() || organization.isEmpty()) {
                continue;
            }
            JobPosting posting = jobPostingRepository
                    .findFirstByOrganizationAndTitleIgnoreCase(organization.get(), record.get("title"))
                    .orElseGet(() -> jobPostingRepository.save(toPosting(record, recruiter.get(), organization.get())));
            if (posting.getPostStatus() == PostStatus.PUBLISHED) {
                // Two applicants in turn per posting, so each applicant's few applications stay under the limit
                apply(applicants.get(published % applicants.size()), posting, ApplicationStatus.APPLIED);
                apply(applicants.get((published + 1) % applicants.size()), posting, ApplicationStatus.SCREENING);
                published++;
            }
        }
    }

    private Applicant applicant(String[] person) {
        return applicantRepository.findByEmailIgnoreCase(person[2]).orElseGet(() -> {
            Applicant applicant = new Applicant();
            applicant.setFirstName(person[0]);
            applicant.setLastName(person[1]);
            applicant.setEmail(person[2]);
            applicant.setAccountStatus(AccountStatus.ACTIVE);
            return applicantRepository.save(applicant);
        });
    }

    private void apply(Applicant applicant, JobPosting posting, ApplicationStatus stage) {
        List<Application> own = applicationRepository.findByApplicant(applicant);
        boolean alreadyApplied = own.stream()
                .anyMatch(application -> posting.getJobPostId() != null
                        && posting.getJobPostId().equals(application.getJobPosting().getJobPostId()));
        long active = own.stream().filter(application -> application.getApplicationStatus().isActive()).count();
        if (alreadyApplied || active >= ApplicationService.APPLICATION_LIMIT) {
            return;
        }
        LocalDate today = LocalDate.now(clock);
        Application application = new Application(applicant, posting, DEMO_RESUME, today);
        if (stage == ApplicationStatus.SCREENING) {
            application.advance(ApplicationStatus.APPLIED, clock.instant());
        }
        applicationRepository.save(application);
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
        String comment = status == PostStatus.RETURNED ? record.get("reviewComment") : null;
        SeedLifecycle.walkPostingTo(posting, status, APPROVED_BY, comment, clock.instant());
        return posting;
    }
}
