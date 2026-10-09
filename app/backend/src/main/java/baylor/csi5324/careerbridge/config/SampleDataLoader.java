package baylor.csi5324.careerbridge.config;

import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import baylor.csi5324.careerbridge.util.CsvReader;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Map;

@Component
public class SampleDataLoader implements CommandLineRunner {

    private static final String JOBS_FILE = "data/jobs.csv";

    private final JobPostingRepository jobPostingRepository;
    private final OrganizationRepository organizationRepository;

    public SampleDataLoader(JobPostingRepository jobPostingRepository,
                            OrganizationRepository organizationRepository) {
        this.jobPostingRepository = jobPostingRepository;
        this.organizationRepository = organizationRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (jobPostingRepository.count() > 0) {
            return;
        }
        String text = new ClassPathResource(JOBS_FILE).getContentAsString(StandardCharsets.UTF_8);
        for (Map<String, String> record : CsvReader.parse(text)) {
            jobPostingRepository.save(toJobPosting(record));
        }
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
