package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.lifecycle.ApplicationLifecycle;
import baylor.csi5324.careerbridge.lifecycle.ApplicationLifecycle.Event;
import baylor.csi5324.careerbridge.lifecycle.ApplicationLifecycle.Move;
import baylor.csi5324.careerbridge.lifecycle.PostingFilled;
import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Resume;
import baylor.csi5324.careerbridge.model.ResumeSnapshot;
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

        ApplicationRefusal refusal = refusal(posting, applicant, resume, clock.instant(), active.size());
        return new ApplicationStart(posting, applicant, resume, active, refusal);
    }

    public SubmittedApplication submitApplication(Long postingId, String applicantEmail) {
        JobPosting posting = jobPostingRepository.findById(postingId)
                .orElseThrow(() -> new PostingNotFoundException(postingId));
        Instant now = clock.instant();
        Applicant applicant = applicant(applicantEmail);
        Resume resume = applicant.getResume();
        long active = applicationRepository.countActiveByApplicant(applicant);
        ApplicationRefusal refusal = refusal(posting, applicant, resume, now, active);
        if (refusal != null) {
            throw new ApplicationRefusedException(refusal);
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

    // One place for the checks of UC-04, so the form and the submit can never disagree (SCRUM-266)
    private ApplicationRefusal refusal(JobPosting posting, Applicant applicant, Resume resume,
                                       Instant now, long activeApplications) {
        if (!posting.isOpen(now)) {
            return ApplicationRefusal.POSTING_CLOSED;
        }
        if (resume == null) {
            return ApplicationRefusal.NO_RESUME;
        }
        if (applicationRepository.existsByApplicantAndJobPosting(applicant, posting)) {
            return ApplicationRefusal.ALREADY_APPLIED;
        }
        if (activeApplications >= APPLICATION_LIMIT) {
            return ApplicationRefusal.LIMIT_REACHED;
        }
        return null;
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
        return applicationRepository.withInterviews(ownedApplication(applicationId, applicant(applicantEmail)));
    }

    // CO-06.1: query-only preview of withdrawal warning before any state changes (FR-UC06.1, FR-UC06.2)
    @Transactional(readOnly = true)
    public WithdrawalPrompt requestWithdrawal(Long applicationId, String applicantEmail) {
        Application application = ownedApplication(applicationId, applicant(applicantEmail));
        check(Move.of(application, clock.instant()), Event.WITHDRAW_APPLICATION);
        return new WithdrawalPrompt(application, WithdrawalPrompt.WARNING, WithdrawalPrompt.REASONS);
    }

    // CO-06.2: transitions to Withdrawn, records date/reason, frees active slot, retains audit record (FR-UC06.4-6.6, 6.9)
    public WithdrawnApplication withdrawApplication(Long applicationId, String applicantEmail, String reason) {
        Applicant applicant = applicant(applicantEmail);
        Application application = ownedApplicationForUpdate(applicationId, applicant);
        fire(Move.of(application, clock.instant()).withNote(normalizeReason(reason)), Event.WITHDRAW_APPLICATION);
        applicationRepository.saveAndFlush(application);
        applicationRepository.withInterviews(application);

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
        requireRevision(expectedRevision);

        long alreadyHired = applicationRepository.countByJobPostingAndApplicationStatus(posting, ApplicationStatus.HIRED);
        fire(Move.of(application, now).answering(expectedRevision, alreadyHired), Event.ACCEPT_OFFER);
        applicationRepository.saveAndFlush(application);

        if (PostingFilled.fillsLastOpening(posting, alreadyHired)) {
            List<Application> remainingActive = applicationRepository
                    .findByJobPostingAndApplicationStatusIn(posting, ApplicationStatus.ACTIVE);
            // A Notification to each rejected applicant would be sent here, from the list returned
            applicationRepository.saveAll(PostingFilled.closeFilledPosting(posting, remainingActive, now));
            jobPostingRepository.save(posting);
            applicationRepository.flush();
        }

        applicationRepository.withInterviews(application);
        int activeCount = (int) applicationRepository.countActiveByApplicant(applicant);
        return new OfferResponseResult(application, activeCount, now);
    }

    // CO-07.3: declines an active offer with an optional reason and frees the active slot (FR-UC07.2-7.3, 7.5-7.6, 7.11)
    public OfferResponseResult declineOffer(Long applicationId, String applicantEmail, String reason,
                                            Integer expectedRevision) {
        Applicant applicant = applicant(applicantEmail);
        Application application = ownedApplicationForUpdate(applicationId, applicant);
        Instant now = clock.instant();
        requireRevision(expectedRevision);
        fire(Move.of(application, now).answering(expectedRevision, 0).withNote(normalizeReason(reason)),
                Event.DECLINE_OFFER);
        applicationRepository.saveAndFlush(application);
        applicationRepository.withInterviews(application);

        int activeCount = (int) applicationRepository.countActiveByApplicant(applicant);
        return new OfferResponseResult(application, activeCount, now);
    }

    private static void requireRevision(Integer expectedRevision) {
        if (expectedRevision == null) {
            throw new IllegalArgumentException("Offer revision is required.");
        }
    }

    private static void fire(Move move, Event event) {
        check(move, event);
        ApplicationLifecycle.TABLE.fire(move, event);
    }

    // The lifecycle decides; this only picks the exception the controller turns into a response
    private static void check(Move move, Event event) {
        Application application = move.application();
        ApplicationLifecycle.TABLE.refusal(move, event).ifPresent(refusal -> {
            if (ApplicationLifecycle.OFFER_REVISED.equals(refusal.rule())) {
                throw new OfferRevisedException(application.getOffer(), move.now(),
                        application.getJobPosting().getOrganization().getZoneId());
            }
            throw new ApplicationActionRefusedException(application.getApplicationStatus(), refusal.message());
        });
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
