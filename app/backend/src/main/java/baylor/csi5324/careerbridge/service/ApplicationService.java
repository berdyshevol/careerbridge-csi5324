package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Offer;
import baylor.csi5324.careerbridge.model.OfferStatus;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.model.Resume;
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

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
@Transactional
public class ApplicationService {

    public static final int APPLICATION_LIMIT = 5;

    private static final Logger log = LoggerFactory.getLogger(ApplicationService.class);

    private final ApplicationRepository applicationRepository;
    private final ApplicantRepository applicantRepository;
    private final JobPostingRepository jobPostingRepository;
    private final Clock clock;

    public ApplicationService(ApplicationRepository applicationRepository,
                              ApplicantRepository applicantRepository,
                              JobPostingRepository jobPostingRepository,
                              Clock clock) {
        this.applicationRepository = applicationRepository;
        this.applicantRepository = applicantRepository;
        this.jobPostingRepository = jobPostingRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public ApplicationStart startApplication(Long postingId, String applicantEmail) {
        JobPosting posting = jobPostingRepository.findById(postingId)
                .orElseThrow(() -> new PostingNotFoundException(postingId));
        Applicant applicant = applicant(applicantEmail);
        Resume resume = applicant.getResume();
        List<Application> active = applicationRepository
                .findByApplicantAndApplicationStatusIn(applicant, ApplicationStatus.ACTIVE);

        ApplicationRefusal refusal = null;
        if (resume == null) {
            refusal = ApplicationRefusal.NO_RESUME;
        } else if (active.size() >= APPLICATION_LIMIT) {
            refusal = ApplicationRefusal.LIMIT_REACHED;
        }
        return new ApplicationStart(posting, applicant, resume, active, refusal);
    }

    public SubmittedApplication submitApplication(Long postingId, String applicantEmail) {
        JobPosting posting = jobPostingRepository.findById(postingId)
                .orElseThrow(() -> new PostingNotFoundException(postingId));
        Instant now = clock.instant();
        if (!posting.isOpen(now)) {
            throw new ApplicationRefusedException(ApplicationRefusal.POSTING_CLOSED);
        }

        Applicant applicant = applicant(applicantEmail);
        Resume resume = applicant.getResume();
        if (resume == null) {
            throw new ApplicationRefusedException(ApplicationRefusal.NO_RESUME);
        }
        if (applicationRepository.existsByApplicantAndJobPosting(applicant, posting)) {
            throw new ApplicationRefusedException(ApplicationRefusal.ALREADY_APPLIED);
        }
        long active = applicationRepository.countActiveByApplicant(applicant);
        if (active >= APPLICATION_LIMIT) {
            throw new ApplicationRefusedException(ApplicationRefusal.LIMIT_REACHED);
        }

        try {
            Application application = applicationRepository.saveAndFlush(
                    new Application(applicant, posting, ResumeSnapshot.of(resume),
                            LocalDate.ofInstant(now, posting.getOrganization().getZoneId())));
            return new SubmittedApplication(application, active + 1);
        } catch (DataIntegrityViolationException sameMomentDuplicate) {
            // A double click: the other request passed the check above first
            throw new ApplicationRefusedException(ApplicationRefusal.ALREADY_APPLIED);
        }
    }

    // CO-05.1: active applications first, ended ones included since they still block reapplying (A5)
    @Transactional(readOnly = true)
    public ApplicantApplications viewApplications(String applicantEmail) {
        List<Application> sorted = applicationRepository.findByApplicant(applicant(applicantEmail)).stream()
                .sorted(Comparator
                        .comparing((Application a) -> !a.isActive())
                        .thenComparing(Application::getLastStageChangeDate, Comparator.reverseOrder())
                        .thenComparing(Application::getDateApplied, Comparator.reverseOrder())
                        .thenComparing(Application::getApplicationId, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
        int activeCount = (int) sorted.stream().filter(Application::isActive).count();
        return new ApplicantApplications(sorted, activeCount);
    }

    // CO-05.2: ownership check reveals nothing and logs the attempt when another applicant asks (BR-15, ext *a)
    @Transactional(readOnly = true)
    public Application viewApplication(Long applicationId, String applicantEmail) {
        Application application = ownedApplication(applicationId, applicant(applicantEmail));
        application.getInterviews().size();
        return application;
    }

    // CO-06.1: query-only preview of withdrawal warning before any state changes (FR-UC06.1, FR-UC06.2)
    @Transactional(readOnly = true)
    public WithdrawalPrompt requestWithdrawal(Long applicationId, String applicantEmail) {
        Application application = ownedApplication(applicationId, applicant(applicantEmail));
        requireWithdrawable(application);
        return new WithdrawalPrompt(application, WithdrawalPrompt.WARNING, WithdrawalPrompt.REASONS);
    }

    // CO-06.2: transitions to Withdrawn, records date/reason, frees active slot, retains audit record (FR-UC06.4-6.6, 6.9)
    public WithdrawnApplication withdrawApplication(Long applicationId, String applicantEmail, String reason) {
        Applicant applicant = applicant(applicantEmail);
        Application application = ownedApplicationForUpdate(applicationId, applicant);
        requireWithdrawable(application);

        Instant now = clock.instant();
        LocalDate withdrawnDate = LocalDate.ofInstant(now, application.getJobPosting().getOrganization().getZoneId());
        String normalizedReason = normalizeReason(reason);

        application.setApplicationStatus(ApplicationStatus.WITHDRAWN);
        application.setWithdrawnAt(now);
        application.getStatusHistory().add(new StatusHistoryEntry(
                ApplicationStatus.WITHDRAWN, withdrawnDate, normalizedReason));
        applicationRepository.saveAndFlush(application);
        application.getInterviews().size();

        int activeCount = (int) applicationRepository.countActiveByApplicant(applicant);
        return new WithdrawnApplication(application, activeCount);
    }

    // CO-07.1: query-only offer view for an application at the Offer stage (FR-UC07.1)
    @Transactional(readOnly = true)
    public Application viewOffer(Long applicationId, String applicantEmail) {
        Application application = ownedApplication(applicationId, applicant(applicantEmail));
        if (application.getApplicationStatus() != ApplicationStatus.OFFER || application.getOffer() == null) {
            throw new ApplicationActionRefusedException(
                    application.getApplicationStatus(),
                    "This application is in the " + application.getApplicationStatus().getLabel()
                            + " stage and has no open offer.");
        }
        return application;
    }

    // CO-07.2: accepts an active offer, closes the posting when filled, and prevents over-hiring (FR-UC07.2-7.4, 7.6-7.7, 7.10-7.11)
    public OfferResponseResult acceptOffer(Long applicationId, String applicantEmail, Integer expectedRevision) {
        Applicant applicant = applicant(applicantEmail);
        Long jobPostId = applicationRepository.findJobPostIdByApplicationId(applicationId)
                .orElseThrow(() -> new ApplicationNotFoundException(applicationId));
        // Lock posting before application so concurrent acceptances serialize without lock-order deadlocks (FR-UC07.10)
        JobPosting posting = jobPostingRepository.findByIdForUpdate(jobPostId)
                .orElseThrow(() -> new ApplicationNotFoundException(applicationId));
        Application application = ownedApplicationForUpdate(applicationId, applicant);
        Instant now = clock.instant();
        Offer offer = requireRespondableOffer(application, now, expectedRevision);

        long alreadyHired = applicationRepository.countByJobPostingAndApplicationStatus(posting, ApplicationStatus.HIRED);
        if (alreadyHired >= posting.getNumberOfOpenings()) {
            throw new ApplicationActionRefusedException(
                    application.getApplicationStatus(),
                    "All openings for this posting have already been filled.");
        }

        LocalDate responseDate = LocalDate.ofInstant(now, posting.getOrganization().getZoneId());
        application.setApplicationStatus(ApplicationStatus.HIRED);
        application.getStatusHistory().add(new StatusHistoryEntry(ApplicationStatus.HIRED, responseDate));
        offer.setStatus(OfferStatus.ACCEPTED);
        offer.setResponseDate(responseDate);
        applicationRepository.saveAndFlush(application);

        if (alreadyHired + 1 >= posting.getNumberOfOpenings()) {
            closeFilledPosting(posting, responseDate, now);
        }

        application.getInterviews().size();
        int activeCount = (int) applicationRepository.countActiveByApplicant(applicant);
        return new OfferResponseResult(application, activeCount, now);
    }

    // Close Job Posting subfunction for UC-07 extension 6c (FR-UC07.7, A2, A3, BR-10, BR-11)
    private void closeFilledPosting(JobPosting posting, LocalDate closedDate, Instant now) {
        if (posting.getPostStatus() == PostStatus.CLOSED) {
            return;
        }
        posting.setPostStatus(PostStatus.CLOSED);
        posting.setClosingReason("Filled");
        posting.setClosedAt(now);
        jobPostingRepository.save(posting);

        List<Application> remainingActive = applicationRepository
                .findByJobPostingAndApplicationStatusIn(posting, ApplicationStatus.ACTIVE);
        for (Application other : remainingActive) {
            other.setApplicationStatus(ApplicationStatus.REJECTED);
            other.setRejectionReason("Posting closed");
            other.getStatusHistory().add(new StatusHistoryEntry(ApplicationStatus.REJECTED, closedDate));
            if (other.getOffer() != null && other.getOffer().getStatus() == OfferStatus.PENDING) {
                other.getOffer().setStatus(OfferStatus.RESCINDED);
            }
            applicationRepository.save(other);
        }
        applicationRepository.flush();
    }

    // CO-07.3: declines an active offer with an optional reason and frees the active slot (FR-UC07.2-7.3, 7.5-7.6, 7.11)
    public OfferResponseResult declineOffer(Long applicationId, String applicantEmail, String reason,
                                            Integer expectedRevision) {
        Applicant applicant = applicant(applicantEmail);
        Application application = ownedApplicationForUpdate(applicationId, applicant);
        Instant now = clock.instant();
        Offer offer = requireRespondableOffer(application, now, expectedRevision);
        LocalDate responseDate = LocalDate.ofInstant(now, application.getJobPosting().getOrganization().getZoneId());
        String normalizedReason = normalizeReason(reason);

        application.setApplicationStatus(ApplicationStatus.OFFER_DECLINED);
        application.getStatusHistory().add(new StatusHistoryEntry(
                ApplicationStatus.OFFER_DECLINED, responseDate, normalizedReason));
        offer.setStatus(OfferStatus.DECLINED);
        offer.setResponseDate(responseDate);
        applicationRepository.saveAndFlush(application);
        application.getInterviews().size();

        int activeCount = (int) applicationRepository.countActiveByApplicant(applicant);
        return new OfferResponseResult(application, activeCount, now);
    }

    private Offer requireRespondableOffer(Application application, Instant now, Integer expectedRevision) {
        if (expectedRevision == null) {
            throw new IllegalArgumentException("Offer revision is required.");
        }
        ApplicationStatus stage = application.getApplicationStatus();
        Offer offer = application.getOffer();
        if (stage != ApplicationStatus.OFFER || offer == null || offer.getStatus() != OfferStatus.PENDING) {
            throw new ApplicationActionRefusedException(
                    stage, "This offer is no longer open. Current stage: " + stage.getLabel() + ".");
        }
        JobPosting posting = application.getJobPosting();
        if (posting.getPostStatus() == PostStatus.CLOSED) {
            throw new ApplicationActionRefusedException(
                    stage, "This posting is closed and the offer can no longer be answered.");
        }
        var zoneId = posting.getOrganization().getZoneId();
        if (offer.isExpired(now, zoneId)) {
            throw new ApplicationActionRefusedException(
                    stage, "The response deadline has passed. This offer can no longer be accepted.");
        }
        if (!expectedRevision.equals(offer.getRevision())) {
            throw new OfferRevisedException(offer, now, zoneId);
        }
        return offer;
    }

    private Application ownedApplication(Long applicationId, Applicant applicant) {
        Application application = applicationRepository.findWithDetailsByApplicationId(applicationId)
                .orElseThrow(() -> new ApplicationNotFoundException(applicationId));
        return verifyOwnership(application, applicationId, applicant);
    }

    private Application ownedApplicationForUpdate(Long applicationId, Applicant applicant) {
        Application application = applicationRepository.findByIdForUpdate(applicationId)
                .orElseThrow(() -> new ApplicationNotFoundException(applicationId));
        return verifyOwnership(application, applicationId, applicant);
    }

    private Application verifyOwnership(Application application, Long applicationId, Applicant applicant) {
        if (!application.getApplicant().getUserId().equals(applicant.getUserId())) {
            log.warn("Unauthorized attempt by applicant {} to access application {}", applicant.getUserId(), applicationId);
            throw new ApplicationNotFoundException(applicationId);
        }
        return application;
    }

    private static void requireWithdrawable(Application application) {
        if (application.isWithdrawable()) {
            return;
        }
        ApplicationStatus stage = application.getApplicationStatus();
        if (stage == ApplicationStatus.OFFER) {
            throw new ApplicationActionRefusedException(
                    stage, "This application is at the Offer stage. Use Decline on the offer instead.");
        }
        throw new ApplicationActionRefusedException(
                stage, "This application is already " + stage.getLabel() + " and can no longer be withdrawn.");
    }

    private static String normalizeReason(String reason) {
        if (reason == null) {
            return null;
        }
        String trimmed = reason.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        return trimmed.length() > 1000 ? trimmed.substring(0, 1000) : trimmed;
    }

    private Applicant applicant(String email) {
        return applicantRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new AccountGoneException(email));
    }
}
