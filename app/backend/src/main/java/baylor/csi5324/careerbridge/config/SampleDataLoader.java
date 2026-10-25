package baylor.csi5324.careerbridge.config;

import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.model.ResumeSnapshot;
import baylor.csi5324.careerbridge.repository.ApplicantRepository;
import baylor.csi5324.careerbridge.repository.ApplicationRepository;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import baylor.csi5324.careerbridge.service.ApplicationService;
import baylor.csi5324.careerbridge.util.CsvReader;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Component
@Order(1)
public class SampleDataLoader implements CommandLineRunner {

    private static final String JOBS_FILE = "data/jobs.csv";
    // The sample applicant's desk, the same as src/lib/sampleDesk.ts in the frontend
    private static final String APPLICATIONS_FILE = "data/applications.csv";
    private static final ResumeSnapshot SAMPLE_RESUME =
            new ResumeSnapshot("Jordan_Lee_Resume.pdf", "application/pdf", 184_320L);

    private final JobPostingRepository jobPostingRepository;
    private final OrganizationRepository organizationRepository;
    private final ApplicantRepository applicantRepository;
    private final ApplicationRepository applicationRepository;

    public SampleDataLoader(JobPostingRepository jobPostingRepository,
                            OrganizationRepository organizationRepository,
                            ApplicantRepository applicantRepository,
                            ApplicationRepository applicationRepository) {
        this.jobPostingRepository = jobPostingRepository;
        this.organizationRepository = organizationRepository;
        this.applicantRepository = applicantRepository;
        this.applicationRepository = applicationRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (jobPostingRepository.count() > 0) {
            return;
        }
        Map<String, JobPosting> postingsByTitle = new HashMap<>();
        for (Map<String, String> record : CsvReader.parse(read(JOBS_FILE))) {
            JobPosting posting = jobPostingRepository.save(toJobPosting(record));
            postingsByTitle.put(posting.getTitle(), posting);
        }

        Applicant applicant = applicantRepository.save(sampleApplicant());
        for (Map<String, String> record : CsvReader.parse(read(APPLICATIONS_FILE))) {
            JobPosting posting = postingsByTitle.get(record.get("jobTitle"));
            if (posting == null) {
                throw new IllegalStateException(APPLICATIONS_FILE + " names a posting that is not in "
                        + JOBS_FILE + ": " + record.get("jobTitle"));
            }
            Application application = new Application(applicant, posting,
                    SAMPLE_RESUME, LocalDate.parse(record.get("dateApplied")));
            application.setApplicationStatus(ApplicationStatus.valueOf(record.get("applicationStatus")));
            applicationRepository.save(application);
        }
    }

    private static String read(String file) throws Exception {
        return new ClassPathResource(file).getContentAsString(StandardCharsets.UTF_8);
    }

    private static Applicant sampleApplicant() {
        Applicant applicant = new Applicant();
        applicant.setFirstName("Jordan");
        applicant.setLastName("Lee");
        applicant.setEmail(ApplicationService.SAMPLE_APPLICANT_EMAIL);
        applicant.setPhone("(254) 555-0142");
        applicant.setAccountStatus(AccountStatus.ACTIVE);
        return applicant;
    }

    private JobPosting toJobPosting(Map<String, String> record) {
        String organizationName = record.get("organizationName");
        Organization organization = organizationRepository.findByName(organizationName)
                .orElseGet(() -> organizationRepository.save(new Organization(organizationName)));

        JobPosting posting = new JobPosting();
        posting.setOrganization(organization);
        posting.setTitle(record.get("title"));
        posting.setDescription(record.get("description"));
        posting.setJobRequirements(record.get("jobRequirements"));
        posting.setLocation(record.get("location"));
        posting.setEmploymentType(record.get("employmentType"));
        posting.setSalaryRange(record.get("salaryRange").isBlank() ? null : record.get("salaryRange"));
        posting.setNumberOfOpenings(Integer.parseInt(record.get("numberOfOpenings")));
        posting.setDatePosted(LocalDate.parse(record.get("datePosted")));
        posting.setApplicationDeadline(LocalDate.parse(record.get("applicationDeadline")));
        posting.setPostStatus(PostStatus.fromLabel(record.get("postStatus")));
        return posting;
    }
}
