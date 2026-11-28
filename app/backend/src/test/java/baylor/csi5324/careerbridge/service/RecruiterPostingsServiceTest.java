package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Lifecycles;
import baylor.csi5324.careerbridge.model.MembershipRequestType;
import baylor.csi5324.careerbridge.model.MembershipStatus;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.OrganizationMembership;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.model.Recruiter;
import baylor.csi5324.careerbridge.model.ResumeSnapshot;
import baylor.csi5324.careerbridge.repository.ApplicantRepository;
import baylor.csi5324.careerbridge.repository.ApplicationRepository;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import baylor.csi5324.careerbridge.repository.OrganizationMembershipRepository;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import baylor.csi5324.careerbridge.repository.RecruiterRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

// CO-14: listPostings is a query, so it has no contract; FR-UC14.1, FR-UC14.9
@SpringBootTest(properties = "careerbridge.recruiter-organization=Screening Test Org")
@Transactional
class RecruiterPostingsServiceTest {

    private static final String RECRUITER = "riley.chen@example.com";

    @Autowired
    private RecruiterPostingsService service;

    @Autowired
    private JobPostingRepository jobPostingRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private ApplicantRepository applicantRepository;

    @Autowired
    private RecruiterRepository recruiterRepository;

    @Autowired
    private OrganizationMembershipRepository membershipRepository;

    private Organization organization;
    private int applicants;

    @BeforeEach
    void replaceSampleData() {
        applicationRepository.deleteAll();
        jobPostingRepository.deleteAll();
        organization = organizationRepository.save(new Organization("Screening Test Org"));
        // Riley is also a member of the sample organizations; the configuration makes this one current
        Recruiter riley = recruiterRepository.findByEmailIgnoreCase(RECRUITER).orElseThrow();
        membershipRepository.save(new OrganizationMembership(riley, organization, MembershipStatus.ACTIVE,
                MembershipRequestType.NEW_RECRUITER_EXISTING_ORGANIZATION, Instant.now()));
    }

    @Test
    void listsEveryPostingOfTheOrganizationWithItsApplicationsAtEachActiveStage() {
        JobPosting analyst = posting(organization, "Data Analyst", PostStatus.PUBLISHED);
        applicationAt(analyst, ApplicationStatus.APPLIED);
        applicationAt(analyst, ApplicationStatus.APPLIED);
        applicationAt(analyst, ApplicationStatus.SCREENING);
        applicationAt(analyst, ApplicationStatus.OFFER);
        JobPosting draft = posting(organization, "Clinical Data Engineer", PostStatus.DRAFT);

        RecruiterPostings postings = service.listPostings(RECRUITER);

        assertEquals("Screening Test Org", postings.organization().getName());
        // Newest first, as every other list of postings
        assertEquals(List.of("Clinical Data Engineer", "Data Analyst"),
                postings.postings().stream().map(p -> p.posting().getTitle()).toList());
        var counts = postings.postings().get(1).applicationsByStage();
        assertEquals(2L, counts.get(ApplicationStatus.APPLIED));
        assertEquals(1L, counts.get(ApplicationStatus.SCREENING));
        assertEquals(0L, counts.get(ApplicationStatus.INTERVIEW));
        assertEquals(1L, counts.get(ApplicationStatus.OFFER));
        assertEquals(0L, postings.postings().get(0).applicationsByStage().get(ApplicationStatus.APPLIED));
        assertEquals(draft.getJobPostId(), postings.postings().get(0).posting().getJobPostId());
    }

    @Test
    void countsOnlyTheActiveStages() {
        JobPosting analyst = posting(organization, "Data Analyst", PostStatus.PUBLISHED);
        applicationAt(analyst, ApplicationStatus.REJECTED);
        applicationAt(analyst, ApplicationStatus.WITHDRAWN);
        applicationAt(analyst, ApplicationStatus.INTERVIEW);

        var counts = service.listPostings(RECRUITER).postings().get(0).applicationsByStage();

        assertEquals(List.of(ApplicationStatus.APPLIED, ApplicationStatus.SCREENING,
                ApplicationStatus.INTERVIEW, ApplicationStatus.OFFER), List.copyOf(counts.keySet()));
        assertEquals(1L, counts.get(ApplicationStatus.INTERVIEW));
        assertEquals(0L, counts.get(ApplicationStatus.APPLIED));
    }

    @Test
    void neverShowsAnotherOrganizationsPostings() {
        Organization other = organizationRepository.save(new Organization("Another Org"));
        posting(organization, "Ours", PostStatus.PUBLISHED);
        JobPosting theirs = posting(other, "Theirs", PostStatus.PUBLISHED);
        applicationAt(theirs, ApplicationStatus.APPLIED);

        RecruiterPostings postings = service.listPostings(RECRUITER);

        assertEquals(List.of("Ours"), postings.postings().stream().map(p -> p.posting().getTitle()).toList());
    }

    @Test
    void showsNothingToARecruiterWithNoActiveMembership() {
        Recruiter newcomer = new Recruiter();
        newcomer.setFirstName("Noor");
        newcomer.setLastName("Haddad");
        newcomer.setEmail("noor.haddad@example.com");
        newcomer.setAccountStatus(AccountStatus.ACTIVE);
        recruiterRepository.save(newcomer);
        posting(organization, "Hidden", PostStatus.PUBLISHED);

        RecruiterPostings postings = service.listPostings("noor.haddad@example.com");

        assertNull(postings.organization());
        assertTrue(postings.postings().isEmpty());
    }

    @Test
    void marksThePostingsTheRecruiterCreated() {
        JobPosting own = posting(organization, "Own", PostStatus.PUBLISHED);
        own.setRecruiter(recruiterRepository.findByEmailIgnoreCase(RECRUITER).orElseThrow());
        jobPostingRepository.save(own);
        posting(organization, "Sample", PostStatus.PUBLISHED);

        var rows = service.listPostings(RECRUITER).postings();

        assertTrue(rows.stream().filter(row -> row.posting().getTitle().equals("Own")).findFirst().orElseThrow().createdByYou());
        assertFalse(rows.stream().filter(row -> row.posting().getTitle().equals("Sample")).findFirst().orElseThrow().createdByYou());
    }

    private JobPosting posting(Organization owner, String title, PostStatus status) {
        JobPosting posting = new JobPosting();
        posting.setOrganization(owner);
        posting.setTitle(title);
        posting.setNumberOfOpenings(1);
        posting.setDatePosted(LocalDate.now());
        posting.setApplicationDeadline(LocalDate.now().plusDays(30));
        return jobPostingRepository.save(Lifecycles.inStatus(posting, status));
    }

    private void applicationAt(JobPosting posting, ApplicationStatus status) {
        Applicant applicant = new Applicant();
        applicant.setFirstName("Pat");
        applicant.setLastName("Applicant" + applicants);
        applicant.setEmail("pat" + applicants++ + "-" + System.nanoTime() + "@example.com");
        applicant.setAccountStatus(AccountStatus.ACTIVE);
        applicantRepository.save(applicant);
        Application application = new Application(applicant, posting,
                new ResumeSnapshot("cv.pdf", "application/pdf", 1024L), LocalDate.now());
        applicationRepository.save(Lifecycles.atStage(application, status));
    }
}
