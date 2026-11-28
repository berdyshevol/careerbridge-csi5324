package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.MembershipRequestType;
import baylor.csi5324.careerbridge.model.MembershipStatus;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.OrganizationMembership;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.model.Recruiter;
import baylor.csi5324.careerbridge.model.Resume;
import baylor.csi5324.careerbridge.model.ResumeSnapshot;
import baylor.csi5324.careerbridge.model.StatusHistoryEntry;
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
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

// CO-14.1 reviewApplication, and the list of a posting's applicants that leads to it; FR-UC14.2, FR-UC14.9
@SpringBootTest(properties = "careerbridge.recruiter-organization=Review Test Org")
@Transactional
class RecruiterApplicationsServiceTest {

    private static final String RECRUITER = "riley.chen@example.com";

    @Autowired
    private RecruiterApplicationsService service;

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
    private JobPosting analyst;
    private int applicants;

    @BeforeEach
    void replaceSampleData() {
        applicationRepository.deleteAll();
        jobPostingRepository.deleteAll();
        organization = organizationRepository.save(new Organization("Review Test Org"));
        // Riley is also a member of the sample organizations; the configuration makes this one current
        Recruiter riley = recruiterRepository.findByEmailIgnoreCase(RECRUITER).orElseThrow();
        membershipRepository.save(new OrganizationMembership(riley, organization, MembershipStatus.ACTIVE,
                MembershipRequestType.NEW_RECRUITER_EXISTING_ORGANIZATION, Instant.now()));
        analyst = posting(organization, "Data Analyst");
    }

    @Test
    void listsTheActiveApplicantsOfAPostingInPipelineOrderThenByDateApplied() {
        applicationAt(analyst, "Omar", "Haddad", ApplicationStatus.SCREENING, LocalDate.now().minusDays(1));
        applicationAt(analyst, "Grace", "Liu", ApplicationStatus.APPLIED, LocalDate.now());
        applicationAt(analyst, "Chris", "Alvarez", ApplicationStatus.APPLIED, LocalDate.now().minusDays(3));

        PostingApplicants view = service.viewPosting(RECRUITER, analyst.getJobPostId());

        assertEquals("Data Analyst", view.posting().getTitle());
        assertEquals(List.of("Chris Alvarez", "Grace Liu", "Omar Haddad"),
                view.applicants().stream().map(PostingApplicants.Applicant::name).toList());
        assertEquals(List.of(ApplicationStatus.APPLIED, ApplicationStatus.APPLIED, ApplicationStatus.SCREENING),
                view.applicants().stream().map(PostingApplicants.Applicant::stage).toList());
    }

    @Test
    void leavesOutApplicationsThatAreNoLongerActive() {
        applicationAt(analyst, "Ben", "Carter", ApplicationStatus.REJECTED, LocalDate.now());
        applicationAt(analyst, "Lucia", "Romero", ApplicationStatus.WITHDRAWN, LocalDate.now());
        applicationAt(analyst, "Noah", "Bennett", ApplicationStatus.OFFER, LocalDate.now());

        PostingApplicants view = service.viewPosting(RECRUITER, analyst.getJobPostId());

        assertEquals(List.of("Noah Bennett"),
                view.applicants().stream().map(PostingApplicants.Applicant::name).toList());
    }

    @Test
    void aPostingWithNoApplicationsHasNoApplicants() {
        assertEquals(List.of(), service.viewPosting(RECRUITER, analyst.getJobPostId()).applicants());
    }

    @Test
    void reviewsTheResumeCopyTheProfileAndThisApplicationsHistory() {
        Applicant jordan = applicant("Jordan", "Lee");
        jordan.setPhone("(512) 555-0193");
        jordan.setLocation("Austin, TX");
        jordan.setHeadline("Analyst moving from retail to healthcare");
        Application application = new Application(jordan, analyst,
                new ResumeSnapshot("jordan-lee.pdf", "application/pdf", 1024L), LocalDate.of(2026, 10, 9));
        application.getStatusHistory().add(new StatusHistoryEntry(ApplicationStatus.SCREENING, LocalDate.of(2026, 10, 14)));
        application.setApplicationStatus(ApplicationStatus.SCREENING);
        applicationRepository.save(application);

        ApplicationReview review = service.reviewApplication(RECRUITER, application.getApplicationId());

        assertEquals("Jordan Lee", review.applicantName());
        assertEquals("Data Analyst", review.postingTitle());
        assertEquals(analyst.getJobPostId(), review.postingId());
        assertEquals(ApplicationStatus.SCREENING, review.stage());
        assertEquals("jordan-lee.pdf", review.resume().getFileName());
        assertEquals(jordan.getEmail(), review.applicant().getEmail());
        assertEquals("(512) 555-0193", review.applicant().getPhone());
        assertEquals("Austin, TX", review.applicant().getLocation());
        assertEquals(List.of(ApplicationStatus.APPLIED, ApplicationStatus.SCREENING),
                review.history().stream().map(entry -> entry.getStatus()).toList());
        assertEquals(LocalDate.of(2026, 10, 14), review.history().get(1).getDate());
    }

    @Test
    void theHistoryIsOnlyThisApplicationsEvenWhenTheApplicantAppliedElsewhere() {
        Organization other = organizationRepository.save(new Organization("Another Org"));
        Applicant jordan = applicant("Jordan", "Lee");
        Application ours = applicationRepository.save(new Application(jordan, analyst,
                new ResumeSnapshot("cv.pdf", "application/pdf", 1L), LocalDate.now()));
        Application elsewhere = new Application(jordan, posting(other, "Elsewhere"),
                new ResumeSnapshot("cv.pdf", "application/pdf", 1L), LocalDate.now());
        elsewhere.setApplicationStatus(ApplicationStatus.REJECTED);
        applicationRepository.save(elsewhere);

        ApplicationReview review = service.reviewApplication(RECRUITER, ours.getApplicationId());

        assertEquals(ApplicationStatus.APPLIED, review.stage());
        assertEquals(1, review.history().size());
    }

    @Test
    void servesTheResumeCopyAsTheApplicantUploadedIt() {
        Applicant jordan = applicant("Jordan", "Lee");
        byte[] content = {1, 2, 3};
        Application application = applicationRepository.save(new Application(jordan, analyst,
                ResumeSnapshot.of(new Resume("jordan-lee.pdf", "application/pdf", 3L, content, LocalDateTime.now())),
                LocalDate.now()));

        ResumeSnapshot snapshot = service.resumeOf(RECRUITER, application.getApplicationId());

        assertEquals("jordan-lee.pdf", snapshot.getFileName());
        assertArrayEquals(content, snapshot.getContent());
    }

    @Test
    void aPostingOfAnotherOrganizationIsNotFound() {
        JobPosting theirs = posting(organizationRepository.save(new Organization("Another Org")), "Theirs");

        assertThrows(PostingNotFoundException.class, () -> service.viewPosting(RECRUITER, theirs.getJobPostId()));
    }

    @Test
    void anUnknownPostingIsNotFoundInTheSameWay() {
        assertThrows(PostingNotFoundException.class, () -> service.viewPosting(RECRUITER, -1L));
    }

    @Test
    void anApplicationOfAnotherOrganizationIsNotFoundForEveryOperation() {
        JobPosting theirs = posting(organizationRepository.save(new Organization("Another Org")), "Theirs");
        Application application = applicationRepository.save(new Application(applicant("Pat", "Stranger"), theirs,
                new ResumeSnapshot("cv.pdf", "application/pdf", 1L), LocalDate.now()));
        Long id = application.getApplicationId();

        assertThrows(ApplicationNotFoundException.class, () -> service.reviewApplication(RECRUITER, id));
        assertThrows(ApplicationNotFoundException.class, () -> service.resumeOf(RECRUITER, id));
    }

    @Test
    void anUnknownApplicationIsNotFoundInTheSameWay() {
        ApplicationNotFoundException unknown = assertThrows(ApplicationNotFoundException.class,
                () -> service.reviewApplication(RECRUITER, -1L));
        // The message names only the id asked for, so it cannot tell a foreign application from a missing one
        assertEquals("Application -1 not found", unknown.getMessage());
    }

    @Test
    void aRecruiterWithNoActiveMembershipFindsNothing() {
        Recruiter newcomer = new Recruiter();
        newcomer.setFirstName("Noor");
        newcomer.setLastName("Haddad");
        newcomer.setEmail("noor.haddad@example.com");
        newcomer.setAccountStatus(AccountStatus.ACTIVE);
        recruiterRepository.save(newcomer);
        Application application = applicationRepository.save(new Application(applicant("Jordan", "Lee"), analyst,
                new ResumeSnapshot("cv.pdf", "application/pdf", 1L), LocalDate.now()));

        assertThrows(PostingNotFoundException.class,
                () -> service.viewPosting("noor.haddad@example.com", analyst.getJobPostId()));
        assertThrows(ApplicationNotFoundException.class,
                () -> service.reviewApplication("noor.haddad@example.com", application.getApplicationId()));
    }

    @Test
    void aDeactivatedRecruiterFindsNothingEvenInASessionOpenedBefore() {
        Recruiter riley = recruiterRepository.findByEmailIgnoreCase(RECRUITER).orElseThrow();
        riley.setAccountStatus(AccountStatus.INACTIVE);
        recruiterRepository.save(riley);

        assertThrows(PostingNotFoundException.class, () -> service.viewPosting(RECRUITER, analyst.getJobPostId()));
    }

    private JobPosting posting(Organization owner, String title) {
        JobPosting posting = new JobPosting();
        posting.setOrganization(owner);
        posting.setTitle(title);
        posting.setNumberOfOpenings(1);
        posting.setDatePosted(LocalDate.now());
        posting.setApplicationDeadline(LocalDate.now().plusDays(30));
        posting.setPostStatus(PostStatus.PUBLISHED);
        return jobPostingRepository.save(posting);
    }

    private Applicant applicant(String firstName, String lastName) {
        Applicant applicant = new Applicant();
        applicant.setFirstName(firstName);
        applicant.setLastName(lastName);
        applicant.setEmail(firstName.toLowerCase() + applicants++ + "-" + System.nanoTime() + "@example.com");
        applicant.setAccountStatus(AccountStatus.ACTIVE);
        return applicantRepository.save(applicant);
    }

    private void applicationAt(JobPosting posting, String firstName, String lastName, ApplicationStatus status,
                               LocalDate dateApplied) {
        Application application = new Application(applicant(firstName, lastName), posting,
                new ResumeSnapshot("cv.pdf", "application/pdf", 1024L), dateApplied);
        application.setApplicationStatus(status);
        applicationRepository.save(application);
    }
}
