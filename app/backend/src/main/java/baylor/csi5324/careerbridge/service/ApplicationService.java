package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Resume;
import baylor.csi5324.careerbridge.model.ResumeSnapshot;
import baylor.csi5324.careerbridge.repository.ApplicantRepository;
import baylor.csi5324.careerbridge.repository.ApplicationRepository;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class ApplicationService {

    public static final int APPLICATION_LIMIT = 5;

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

    // Ended applications too: the apply screen needs them, since a posting can be applied to once (A5)
    @Transactional(readOnly = true)
    public List<Application> viewApplications(String applicantEmail) {
        return applicationRepository.findByApplicant(applicant(applicantEmail));
    }

    private Applicant applicant(String email) {
        return applicantRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new AccountGoneException(email));
    }
}
