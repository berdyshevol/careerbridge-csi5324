package baylor.csi5324.careerbridge.config;

import baylor.csi5324.careerbridge.lifecycle.ApplicationLifecycle;
import baylor.csi5324.careerbridge.lifecycle.JobPostingLifecycle;
import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.Interview;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Offer;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.OrganizationStatus;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.model.Recruiter;
import baylor.csi5324.careerbridge.model.Resume;
import baylor.csi5324.careerbridge.model.ResumeSnapshot;
import baylor.csi5324.careerbridge.repository.ApplicantRepository;
import baylor.csi5324.careerbridge.repository.ApplicationRepository;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import baylor.csi5324.careerbridge.repository.RecruiterRepository;
import baylor.csi5324.careerbridge.repository.ResumeRepository;
import baylor.csi5324.careerbridge.util.CsvReader;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Component
@Order(1)
public class SampleDataLoader implements CommandLineRunner {

    private static final String JOBS_FILE = "data/jobs.csv";
    // The recruiters a sample posting may name as its creator, so Close and Revise work on it in a demo.
    // DemoUsers gives them their password, as it does for Jordan Lee
    private static final String RECRUITERS_FILE = "data/recruiters.csv";
    // The sample applicant's desk, the same as src/lib/sampleDesk.ts in the frontend
    private static final String APPLICATIONS_FILE = "data/applications.csv";
    // Jordan Lee, the demo applicant who starts with the sample applications (DemoUsers gives the password)
    public static final String SAMPLE_APPLICANT_EMAIL = "jordan.lee@example.com";
    // The copy that went with the sample applications, taken before uploads existed, so it has no content
    private static final ResumeSnapshot SAMPLE_RESUME =
            new ResumeSnapshot("Jordan_Lee_Resume.pdf", "application/pdf", 184_320L);
    // Jordan's resume on file, so the demo applicant can apply at once (UC-04 2a refuses without one)
    private static final String SAMPLE_RESUME_FILE = "data/Jordan_Lee_Resume.pdf";

    private final JobPostingRepository jobPostingRepository;
    private final OrganizationRepository organizationRepository;
    private final ApplicantRepository applicantRepository;
    private final ApplicationRepository applicationRepository;
    private final ResumeRepository resumeRepository;
    private final RecruiterRepository recruiterRepository;

    public SampleDataLoader(JobPostingRepository jobPostingRepository,
                            OrganizationRepository organizationRepository,
                            ApplicantRepository applicantRepository,
                            ApplicationRepository applicationRepository,
                            ResumeRepository resumeRepository,
                            RecruiterRepository recruiterRepository) {
        this.jobPostingRepository = jobPostingRepository;
        this.organizationRepository = organizationRepository;
        this.applicantRepository = applicantRepository;
        this.applicationRepository = applicationRepository;
        this.resumeRepository = resumeRepository;
        this.recruiterRepository = recruiterRepository;
    }

    // The back-fill below walks lazy collections of applications already in the database
    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (jobPostingRepository.count() > 0) {
            // A database loaded before resumes or stage histories existed: keep Jordan's demo desk complete
            applicantRepository.findByEmailIgnoreCase(SAMPLE_APPLICANT_EMAIL).ifPresent(jordan -> {
                if (jordan.getResume() == null) {
                    jordan.setResume(resumeRepository.save(sampleResume()));
                    applicantRepository.save(jordan);
                }
                for (Application application : applicationRepository.findByApplicant(jordan)) {
                    ApplicationStatus status = application.getApplicationStatus();
                    boolean updated = false;
                    if (application.getStatusHistory().size() <= 1
                            && (status == ApplicationStatus.SCREENING
                                    || status == ApplicationStatus.INTERVIEW
                                    || status == ApplicationStatus.OFFER)) {
                        seedStageHistoryAndInterviews(
                                application, application.getDateApplied(), status);
                        updated = true;
                    }
                    if (status == ApplicationStatus.OFFER && application.getOffer() == null) {
                        application.setOffer(sampleOffer(application, application.getDateApplied()));
                        updated = true;
                    }
                    if (updated) {
                        applicationRepository.save(application);
                    }
                }
            });
            return;
        }
        for (Map<String, String> record : CsvReader.parse(read(RECRUITERS_FILE))) {
            // A database without postings may already have the account, from DemoUsers on an earlier start
            if (recruiterRepository.findByEmailIgnoreCase(record.get("email")).isEmpty()) {
                recruiterRepository.save(toRecruiter(record));
            }
        }
        Map<String, JobPosting> postingsByTitle = new HashMap<>();
        for (Map<String, String> record : CsvReader.parse(read(JOBS_FILE))) {
            JobPosting posting = jobPostingRepository.save(toJobPosting(record));
            postingsByTitle.put(posting.getTitle(), posting);
        }

        Applicant sample = sampleApplicant();
        sample.setResume(resumeRepository.save(sampleResume()));
        Applicant applicant = applicantRepository.save(sample);
        for (Map<String, String> record : CsvReader.parse(read(APPLICATIONS_FILE))) {
            JobPosting posting = postingsByTitle.get(record.get("jobTitle"));
            if (posting == null) {
                throw new IllegalStateException(APPLICATIONS_FILE + " names a posting that is not in "
                        + JOBS_FILE + ": " + record.get("jobTitle"));
            }
            LocalDate appliedDate = LocalDate.parse(record.get("dateApplied"));
            ApplicationStatus status = ApplicationStatus.valueOf(record.get("applicationStatus"));
            Application application = new Application(applicant, posting, SAMPLE_RESUME, appliedDate);
            seedStageHistoryAndInterviews(application, appliedDate, status);
            applicationRepository.save(application);
        }
    }

    private static void seedStageHistoryAndInterviews(Application application, LocalDate appliedDate,
                                                      ApplicationStatus status) {
        ApplicationLifecycle.restore(application, status,
                appliedDate.plusDays(4), appliedDate.plusDays(9), appliedDate.plusDays(16));
        if (status == ApplicationStatus.INTERVIEW || status == ApplicationStatus.OFFER) {
            Interview interview = new Interview(
                    application,
                    1,
                    appliedDate.plusDays(12).atTime(14, 0),
                    "On-site",
                    "1200 Austin Ave, Waco");
            // Recruiter-only fields seeded to verify applicant endpoints never expose them (A12)
            interview.setOutcome("Passed");
            interview.setNotes("Internal panel note");
            application.getInterviews().add(interview);
        }
        if (status == ApplicationStatus.OFFER) {
            if (application.getOffer() == null) {
                application.setOffer(sampleOffer(application, appliedDate));
            }
        }
    }

    private static Offer sampleOffer(Application application, LocalDate appliedDate) {
        return new Offer(
                application,
                appliedDate.plusDays(16),
                LocalDate.of(2027, 7, 19),
                "$54,000 USD per year",
                "Full-time on-site in Waco. Health, dental, and 401(k) match from day one.",
                LocalDate.of(2027, 6, 30),
                "Waco_Health_Offer_Letter.pdf");
    }

    private static String read(String file) throws Exception {
        return new ClassPathResource(file).getContentAsString(StandardCharsets.UTF_8);
    }

    private static Resume sampleResume() {
        byte[] content;
        try {
            content = new ClassPathResource(SAMPLE_RESUME_FILE).getContentAsByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        return new Resume(SAMPLE_RESUME.getFileName(), SAMPLE_RESUME.getFileType(), content.length, content,
                LocalDateTime.of(2026, 9, 30, 14, 0));
    }

    private static Applicant sampleApplicant() {
        Applicant applicant = new Applicant();
        applicant.setFirstName("Jordan");
        applicant.setLastName("Lee");
        applicant.setEmail(SAMPLE_APPLICANT_EMAIL);
        applicant.setPhone("(254) 555-0142");
        applicant.setAccountStatus(AccountStatus.ACTIVE);
        return applicant;
    }

    private JobPosting toJobPosting(Map<String, String> record) {
        String organizationName = record.get("organizationName");
        Organization organization = organizationRepository.findByName(organizationName)
                .orElseGet(() -> {
                    Organization sample = new Organization(organizationName);
                    sample.setOrganizationStatus(OrganizationStatus.ACTIVE);
                    return organizationRepository.save(sample);
                });

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
        JobPostingLifecycle.restore(posting, PostStatus.fromLabel(record.get("postStatus")));
        String recruiterEmail = record.get("recruiterEmail");
        if (!recruiterEmail.isBlank()) {
            posting.setRecruiter(recruiterRepository.findByEmailIgnoreCase(recruiterEmail)
                    .orElseThrow(() -> new IllegalStateException(JOBS_FILE + " names a recruiter that is not in "
                            + RECRUITERS_FILE + ": " + recruiterEmail)));
        }
        return posting;
    }

    private static Recruiter toRecruiter(Map<String, String> record) {
        Recruiter recruiter = new Recruiter();
        recruiter.setFirstName(record.get("firstName"));
        recruiter.setLastName(record.get("lastName"));
        recruiter.setEmail(record.get("email"));
        recruiter.setAccountStatus(AccountStatus.ACTIVE);
        return recruiter;
    }
}
