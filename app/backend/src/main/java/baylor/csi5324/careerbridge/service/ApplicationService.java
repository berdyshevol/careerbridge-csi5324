package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.controller.dto.ApplicationDetailResponse;
import baylor.csi5324.careerbridge.controller.dto.ApplicationListResponse;
import baylor.csi5324.careerbridge.controller.dto.ApplicationSummaryResponse;
import baylor.csi5324.careerbridge.controller.dto.OfferDecisionResponse;
import baylor.csi5324.careerbridge.controller.dto.OfferResponse;
import baylor.csi5324.careerbridge.controller.dto.WithdrawalRequestResponse;
import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Offer;
import baylor.csi5324.careerbridge.model.OfferStatus;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.model.ResumeSnapshot;
import baylor.csi5324.careerbridge.model.StatusHistoryEntry;
import baylor.csi5324.careerbridge.repository.ApplicantRepository;
import baylor.csi5324.careerbridge.repository.ApplicationRepository;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@Transactional
public class ApplicationService {

    private static final Logger log = LoggerFactory.getLogger(ApplicationService.class);

    public static final int APPLICATION_LIMIT = 5;
    public static final String POSTING_CLOSED_REASON = "Posting closed";

    // STAND-IN: nobody can log in yet, so every application comes from the sample
    // applicant whose desk the frontend shows (src/lib/sampleDesk.ts). Log In replaces it.
    public static final String SAMPLE_APPLICANT_EMAIL = "jordan.lee@example.com";

    private static final String ALREADY_APPLIED =
            "You already applied to this posting. A posting can be applied to once.";
    private static final int MAX_REASON_LENGTH = 2000;

    private final ApplicationRepository applicationRepository;
    private final ApplicantRepository applicantRepository;
    private final JobPostingRepository jobPostingRepository;

    public ApplicationService(ApplicationRepository applicationRepository,
                              ApplicantRepository applicantRepository,
                              JobPostingRepository jobPostingRepository) {
        this.applicationRepository = applicationRepository;
        this.applicantRepository = applicantRepository;
        this.jobPostingRepository = jobPostingRepository;
    }

    // STAND-IN: the resume comes from the caller until UC-03 keeps it in the backend
    public SubmittedApplication submitApplication(Long postingId, ResumeSnapshot resume) {
        JobPosting posting = jobPostingRepository.findById(postingId)
                .orElseThrow(() -> new PostingNotFoundException(postingId));
        LocalDate today = LocalDate.now();
        if (!posting.isOpen(today)) {
            throw new ApplicationRefusedException("This posting no longer accepts applications.");
        }
        if (resume == null) {
            throw new ApplicationRefusedException("A resume is required to apply. "
                    + "Upload one in Profile & resume, then come back to this posting.");
        }

        Applicant applicant = currentApplicant();
        if (applicationRepository.existsByApplicantAndJobPosting(applicant, posting)) {
            throw new ApplicationRefusedException(ALREADY_APPLIED);
        }
        long active = applicationRepository.countActiveByApplicant(applicant);
        if (active >= APPLICATION_LIMIT) {
            throw new ApplicationRefusedException("You have " + APPLICATION_LIMIT
                    + " active applications, the most allowed at once. A slot frees up when you "
                    + "withdraw one or it reaches Hired, Rejected or Offer Declined.");
        }

        try {
            Application application = applicationRepository.saveAndFlush(
                    new Application(applicant, posting, resume, today));
            return new SubmittedApplication(application, active + 1);
        } catch (DataIntegrityViolationException sameMomentDuplicate) {
            // A double click: the other request passed the check above first
            throw new ApplicationRefusedException(ALREADY_APPLIED);
        }
    }

    @Transactional(readOnly = true)
    public ApplicationListResponse viewApplications() {
        Applicant applicant = currentApplicant();
        List<ApplicationSummaryResponse> summaries = applicationRepository
                .findByApplicantOrderByDateAppliedDescApplicationIdDesc(applicant)
                .stream()
                .sorted(Comparator.comparing((Application a) -> !a.isActive())
                        .thenComparing(Application::getApplicationId))
                .map(ApplicationSummaryResponse::from)
                .toList();
        long activeCount = applicationRepository.countActiveByApplicant(applicant);
        return new ApplicationListResponse(summaries, activeCount);
    }

    @Transactional(readOnly = true)
    public ApplicationDetailResponse viewApplication(Long applicationId) {
        Applicant applicant = currentApplicant();
        Application application = findOwnedApplication(applicationId, applicant);
        long activeCount = applicationRepository.countActiveByApplicant(applicant);
        return ApplicationDetailResponse.from(application, activeCount);
    }

    @Transactional(readOnly = true)
    public WithdrawalRequestResponse requestWithdrawal(Long applicationId) {
        Applicant applicant = currentApplicant();
        Application application = findOwnedApplication(applicationId, applicant);
        requireWithdrawableStage(application);
        return WithdrawalRequestResponse.from(application);
    }

    public ApplicationDetailResponse withdrawApplication(Long applicationId, String reason) {
        Applicant applicant = currentApplicant();
        Application application = findOwnedApplication(applicationId, applicant);
        requireWithdrawableStage(application);
        String cleanReason = normalizeReason(reason);

        application.setApplicationStatus(ApplicationStatus.WITHDRAWN);
        application.setWithdrawnAt(Instant.now());
        application.getStatusHistory().add(
                new StatusHistoryEntry(ApplicationStatus.WITHDRAWN, LocalDate.now(), cleanReason));
        applicationRepository.saveAndFlush(application);

        long activeCount = applicationRepository.countActiveByApplicant(applicant);
        return ApplicationDetailResponse.from(application, activeCount);
    }

    @Transactional(readOnly = true)
    public OfferResponse viewOffer(Long applicationId) {
        Applicant applicant = currentApplicant();
        Application application = findOwnedApplication(applicationId, applicant);
        if (application.getOffer() == null) {
            throw new ApplicationRefusedException("No job offer was found for this application.");
        }
        return OfferResponse.from(application);
    }

    public OfferDecisionResponse acceptOffer(Long applicationId) {
        return acceptOffer(applicationId, null, null);
    }

    public OfferDecisionResponse acceptOffer(Long applicationId, String expectedSalary,
                                             LocalDate expectedExpirationDate) {
        Applicant applicant = currentApplicant();
        Application application = findOwnedApplication(applicationId, applicant);
        // Lock the posting so concurrent acceptances cannot exceed numberOfOpenings (NFR-UC07.1)
        JobPosting posting = jobPostingRepository
                .findWithLockByJobPostId(application.getJobPosting().getJobPostId())
                .orElseThrow(() -> new PostingNotFoundException(application.getJobPosting().getJobPostId()));

        Offer offer = requireOpenOffer(application, posting);
        LocalDate today = LocalDate.now();
        if (offer.getExpirationDate() != null && offer.getExpirationDate().isBefore(today)) {
            throw new ApplicationRefusedException(
                    "The response deadline for this offer has passed, so it can no longer be accepted.");
        }
        if ((expectedSalary != null && !expectedSalary.equals(offer.getSalary()))
                || (expectedExpirationDate != null && !expectedExpirationDate.equals(offer.getExpirationDate()))) {
            throw new ApplicationRefusedException(
                    "The recruiter revised this offer since you opened it. Please review the updated offer terms before accepting.");
        }

        long hiredCount = applicationRepository.countByJobPostingAndApplicationStatus(
                posting, ApplicationStatus.HIRED);
        if (hiredCount >= posting.getNumberOfOpenings()) {
            throw new ApplicationRefusedException("This position has already been filled.");
        }

        application.setApplicationStatus(ApplicationStatus.HIRED);
        application.getStatusHistory().add(new StatusHistoryEntry(ApplicationStatus.HIRED, today));
        offer.setStatus(OfferStatus.ACCEPTED);
        offer.setResponseDate(today);
        applicationRepository.saveAndFlush(application);

        boolean postingClosed = false;
        if (hiredCount + 1 >= posting.getNumberOfOpenings()) {
            closeJobPostingAsFilled(posting, today);
            postingClosed = true;
        }

        long activeCount = applicationRepository.countActiveByApplicant(applicant);
        return new OfferDecisionResponse(
                application.getApplicationId(),
                application.getApplicationStatus(),
                offer.getStatus(),
                today,
                postingClosed,
                activeCount);
    }

    public OfferDecisionResponse declineOffer(Long applicationId, String reason) {
        Applicant applicant = currentApplicant();
        Application application = findOwnedApplication(applicationId, applicant);
        JobPosting posting = application.getJobPosting();
        Offer offer = requireOpenOffer(application, posting);
        String cleanReason = normalizeReason(reason);
        LocalDate today = LocalDate.now();

        application.setApplicationStatus(ApplicationStatus.OFFER_DECLINED);
        application.getStatusHistory().add(
                new StatusHistoryEntry(ApplicationStatus.OFFER_DECLINED, today, cleanReason));
        offer.setStatus(OfferStatus.DECLINED);
        offer.setResponseDate(today);
        applicationRepository.saveAndFlush(application);

        long activeCount = applicationRepository.countActiveByApplicant(applicant);
        return new OfferDecisionResponse(
                application.getApplicationId(),
                application.getApplicationStatus(),
                offer.getStatus(),
                today,
                false,
                activeCount);
    }

    private void closeJobPostingAsFilled(JobPosting posting, LocalDate today) {
        if (posting.getPostStatus() == PostStatus.CLOSED) {
            return;
        }
        posting.setPostStatus(PostStatus.CLOSED);
        posting.setCloseReason("Filled");
        posting.setClosedAt(LocalDateTime.now());
        jobPostingRepository.saveAndFlush(posting);

        List<Application> remainingActive = applicationRepository
                .findByJobPostingAndApplicationStatusIn(posting, ApplicationStatus.ACTIVE);
        for (Application other : remainingActive) {
            if (other.getOffer() != null && other.getOffer().getStatus() == OfferStatus.EXTENDED) {
                other.getOffer().setStatus(OfferStatus.RESCINDED);
            }
            other.setApplicationStatus(ApplicationStatus.REJECTED);
            other.setRejectionReason(POSTING_CLOSED_REASON);
            other.getStatusHistory().add(
                    new StatusHistoryEntry(ApplicationStatus.REJECTED, today, POSTING_CLOSED_REASON));
            applicationRepository.saveAndFlush(other);
        }
    }

    private Applicant currentApplicant() {
        return applicantRepository.findByEmail(SAMPLE_APPLICANT_EMAIL)
                .orElseThrow(() -> new IllegalStateException("The sample applicant was not loaded"));
    }

    private Application findOwnedApplication(Long applicationId, Applicant applicant) {
        return applicationRepository.findByApplicationIdAndApplicant(applicationId, applicant)
                .orElseGet(() -> {
                    // Reveal nothing about another applicant's application and record the attempt (BR-15, NFR-UC05.2)
                    log.warn("Applicant {} asked for application {} which does not belong to them or does not exist",
                            applicant.getEmail(), applicationId);
                    throw new ApplicationNotFoundException(applicationId);
                });
    }

    private static void requireWithdrawableStage(Application application) {
        if (application.getApplicationStatus() == ApplicationStatus.OFFER) {
            throw new ApplicationRefusedException(
                    "This application moved to the Offer stage. Please decline the job offer instead of withdrawing.");
        }
        if (!application.canWithdraw()) {
            throw new ApplicationRefusedException(
                    "This application can no longer be withdrawn because it is at the "
                            + formatStage(application.getApplicationStatus()) + " stage.");
        }
    }

    private static Offer requireOpenOffer(Application application, JobPosting posting) {
        Offer offer = application.getOffer();
        if (application.getApplicationStatus() != ApplicationStatus.OFFER
                || offer == null
                || offer.getStatus() != OfferStatus.EXTENDED) {
            throw new ApplicationRefusedException(
                    "This offer is no longer open. The application is currently at the "
                            + formatStage(application.getApplicationStatus()) + " stage.");
        }
        if (posting.getPostStatus() != PostStatus.PUBLISHED) {
            throw new ApplicationRefusedException(
                    "This offer is no longer open because the job posting has closed.");
        }
        return offer;
    }

    private static String normalizeReason(String reason) {
        if (reason == null || reason.isBlank()) {
            return null;
        }
        if (reason.length() > MAX_REASON_LENGTH) {
            throw new ApplicationRefusedException("The reason is too long.");
        }
        return reason.trim();
    }

    public static String formatStage(ApplicationStatus status) {
        return switch (status) {
            case APPLIED -> "Applied";
            case SCREENING -> "Screening";
            case INTERVIEW -> "Interview";
            case OFFER -> "Offer";
            case HIRED -> "Hired";
            case REJECTED -> "Rejected";
            case WITHDRAWN -> "Withdrawn";
            case OFFER_DECLINED -> "Offer Declined";
        };
    }
}
