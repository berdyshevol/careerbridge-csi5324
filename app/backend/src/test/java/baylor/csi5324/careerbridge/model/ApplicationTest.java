package baylor.csi5324.careerbridge.model;

import baylor.csi5324.careerbridge.repository.ApplicantRepository;
import baylor.csi5324.careerbridge.repository.ApplicationRepository;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest
class ApplicationTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 10, 13);

    @Autowired
    private ApplicationRepository applicationRepository;
    @Autowired
    private ApplicantRepository applicantRepository;
    @Autowired
    private JobPostingRepository jobPostingRepository;
    @Autowired
    private OrganizationRepository organizationRepository;

    private Applicant applicant;
    private int postings;

    @BeforeEach
    void setUp() {
        applicant = new Applicant();
        applicant.setFirstName("Grace");
        applicant.setLastName("Hopper");
        applicant.setEmail("grace@example.com");
        applicant.setAccountStatus(AccountStatus.ACTIVE);
        applicantRepository.save(applicant);
    }

    private JobPosting newPosting() {
        Organization organization = organizationRepository.findAll().stream().findFirst()
                .orElseGet(() -> {
                    Organization created = new Organization();
                    created.setName("Acme");
                    return organizationRepository.save(created);
                });
        JobPosting posting = new JobPosting();
        posting.setTitle("Posting " + postings++);
        posting.setOrganization(organization);
        return jobPostingRepository.save(posting);
    }

    private Application apply(JobPosting posting, ApplicationStatus status) {
        Application application = new Application(applicant, posting,
                new ResumeSnapshot("cv.pdf", "PDF", 1024), TODAY);
        application.setApplicationStatus(status);
        return applicationRepository.saveAndFlush(application);
    }

    @Test
    void savesAnApplicationWithItsSnapshotAndHistory() {
        Long id = apply(newPosting(), ApplicationStatus.APPLIED).getApplicationId();

        Application reloaded = applicationRepository.findById(id).orElseThrow();
        assertEquals(ApplicationStatus.APPLIED, reloaded.getApplicationStatus());
        assertEquals("cv.pdf", reloaded.getResumeSnapshot().getFileName());
        assertEquals(1, reloaded.getStatusHistory().size());
        assertEquals(ApplicationStatus.APPLIED, reloaded.getStatusHistory().get(0).getStatus());
        assertEquals(TODAY, reloaded.getStatusHistory().get(0).getDate());
    }

    @Test
    void countsOnlyTheActiveApplicationsOfTheApplicant() {
        apply(newPosting(), ApplicationStatus.APPLIED);
        apply(newPosting(), ApplicationStatus.SCREENING);
        apply(newPosting(), ApplicationStatus.INTERVIEW);
        apply(newPosting(), ApplicationStatus.OFFER);
        apply(newPosting(), ApplicationStatus.WITHDRAWN);
        apply(newPosting(), ApplicationStatus.REJECTED);
        apply(newPosting(), ApplicationStatus.HIRED);
        apply(newPosting(), ApplicationStatus.OFFER_DECLINED);

        assertEquals(4, applicationRepository.countActiveByApplicant(applicant));
    }

    @Test
    void knowsWhetherTheApplicantEverAppliedToAPostingEvenWhenWithdrawn() {
        JobPosting withdrawn = newPosting();
        apply(withdrawn, ApplicationStatus.WITHDRAWN);
        JobPosting untouched = newPosting();

        assertTrue(applicationRepository.existsByApplicantAndJobPosting(applicant, withdrawn));
        assertFalse(applicationRepository.existsByApplicantAndJobPosting(applicant, untouched));
    }
}
