package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Offer;
import baylor.csi5324.careerbridge.model.OfferStatus;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.model.ResumeSnapshot;
import baylor.csi5324.careerbridge.model.StatusHistoryEntry;
import baylor.csi5324.careerbridge.repository.ApplicantRepository;
import baylor.csi5324.careerbridge.repository.ApplicationRepository;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

// FR-UC07.10 & A2: runs real concurrent transactions to prove two simultaneous acceptances never exceed numberOfOpenings
@SpringBootTest
class OfferAcceptanceConcurrencyTest {

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private JobPostingRepository jobPostingRepository;

    @Autowired
    private ApplicantRepository applicantRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Test
    void concurrentAcceptancesForSingleOpeningProduceExactlyOneHireAndClosePosting() throws Exception {
        String suffix = String.valueOf(System.nanoTime());
        Organization org = organizationRepository.save(new Organization("Concurrent Org " + suffix));
        JobPosting posting = new JobPosting();
        posting.setOrganization(org);
        posting.setTitle("Concurrent Role " + suffix);
        posting.setLocation("Remote");
        posting.setEmploymentType("Full-time");
        posting.setNumberOfOpenings(1);
        posting.setDatePosted(LocalDate.now());
        posting.setApplicationDeadline(LocalDate.now().plusDays(14));
        posting.setPostStatus(PostStatus.PUBLISHED);
        posting = jobPostingRepository.save(posting);

        Applicant first = saveApplicant("first-" + suffix + "@example.com");
        Applicant second = saveApplicant("second-" + suffix + "@example.com");
        Application firstApp = saveOfferApplication(first, posting);
        Application secondApp = saveOfferApplication(second, posting);

        try {
            CyclicBarrier startTogether = new CyclicBarrier(2);
            AtomicInteger succeeded = new AtomicInteger();
            AtomicInteger refused = new AtomicInteger();

            Callable<Void> taskA = () -> {
                startTogether.await();
                try {
                    applicationService.acceptOffer(firstApp.getApplicationId(), first.getEmail(), 1);
                    succeeded.incrementAndGet();
                } catch (ApplicationActionRefusedException expected) {
                    refused.incrementAndGet();
                }
                return null;
            };
            Callable<Void> taskB = () -> {
                startTogether.await();
                try {
                    applicationService.acceptOffer(secondApp.getApplicationId(), second.getEmail(), 1);
                    succeeded.incrementAndGet();
                } catch (ApplicationActionRefusedException expected) {
                    refused.incrementAndGet();
                }
                return null;
            };

            ExecutorService pool = Executors.newFixedThreadPool(2);
            try {
                List<Future<Void>> futures = pool.invokeAll(List.of(taskA, taskB));
                for (Future<Void> future : futures) {
                    future.get();
                }
            } finally {
                pool.shutdownNow();
            }

            assertEquals(1, succeeded.get());
            assertEquals(1, refused.get());

            JobPosting finalPosting = jobPostingRepository.findById(posting.getJobPostId()).orElseThrow();
            assertEquals(PostStatus.CLOSED, finalPosting.getPostStatus());
            assertEquals("Filled", finalPosting.getClosingReason());
            assertNotNull(finalPosting.getClosedAt());
            assertEquals(1, applicationRepository.countByJobPostingAndApplicationStatus(finalPosting, ApplicationStatus.HIRED));

            Application a = applicationRepository.findWithDetailsByApplicationId(firstApp.getApplicationId()).orElseThrow();
            Application b = applicationRepository.findWithDetailsByApplicationId(secondApp.getApplicationId()).orElseThrow();
            Application loser = a.getApplicationStatus() == ApplicationStatus.HIRED ? b : a;
            assertEquals(ApplicationStatus.REJECTED, loser.getApplicationStatus());
            assertEquals("Posting closed", loser.getRejectionReason());
            assertEquals(OfferStatus.RESCINDED, loser.getOffer().getStatus());
        } finally {
            applicationRepository.deleteAllById(List.of(firstApp.getApplicationId(), secondApp.getApplicationId()));
            jobPostingRepository.deleteById(posting.getJobPostId());
            organizationRepository.deleteById(org.getOrganizationId());
            applicantRepository.deleteAllById(List.of(first.getUserId(), second.getUserId()));
        }
    }

    private Applicant saveApplicant(String email) {
        Applicant applicant = new Applicant();
        applicant.setFirstName("Race");
        applicant.setLastName("Applicant");
        applicant.setEmail(email);
        applicant.setAccountStatus(AccountStatus.ACTIVE);
        return applicantRepository.save(applicant);
    }

    private Application saveOfferApplication(Applicant applicant, JobPosting posting) {
        LocalDate today = LocalDate.now();
        Application application = new Application(
                applicant,
                posting,
                new ResumeSnapshot("cv.pdf", "application/pdf", 512L),
                today);
        application.setApplicationStatus(ApplicationStatus.OFFER);
        application.getStatusHistory().add(new StatusHistoryEntry(ApplicationStatus.OFFER, today));
        application.setOffer(new Offer(
                application,
                today,
                today.plusDays(30),
                "$70,000 USD per year",
                "Standard terms.",
                today.plusDays(7),
                null));
        return applicationRepository.save(application);
    }
}
