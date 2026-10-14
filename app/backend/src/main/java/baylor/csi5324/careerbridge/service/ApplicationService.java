package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.model.ResumeSnapshot;
import baylor.csi5324.careerbridge.repository.ApplicantRepository;
import baylor.csi5324.careerbridge.repository.ApplicationRepository;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class ApplicationService {

    // BR-4: An applicant may have at most 5 active applications at once
    public static final int APPLICATION_LIMIT = 5;

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

    // System operation CO-04.1: submitApplication
    public Application submitApplication(Long postingId, Long applicantId, ResumeSnapshot resumeSnapshot) {
        JobPosting posting = jobPostingRepository.findById(postingId)
                .orElseThrow(() -> new PostingNotFoundException(postingId));

        LocalDate today = LocalDate.now();
        if (posting.getPostStatus() != PostStatus.PUBLISHED
                || posting.getApplicationDeadline().isBefore(today)) {
            throw new PostingClosedException(postingId);
        }

        Applicant applicant = resolveApplicant(applicantId);

        // A5: An applicant can apply to each posting at most once, withdrawn ones included
        if (applicationRepository.existsByApplicantAndJobPosting(applicant, posting)) {
            throw new DuplicateApplicationException(postingId);
        }

        // BR-4: At most 5 active applications at once
        long activeCount = applicationRepository.countActiveByApplicant(applicant);
        if (activeCount >= APPLICATION_LIMIT) {
            throw new ApplicationLimitExceededException(APPLICATION_LIMIT);
        }

        ResumeSnapshot snapshot = resumeSnapshot != null
                ? resumeSnapshot
                : new ResumeSnapshot("resume.pdf", "application/pdf", 1024L);

        Application application = new Application(applicant, posting, snapshot, today);
        return applicationRepository.save(application);
    }

    @Transactional(readOnly = true)
    public long getActiveApplicationCount(Long applicantId) {
        Applicant applicant = resolveApplicant(applicantId);
        return applicationRepository.countActiveByApplicant(applicant);
    }

    @Transactional(readOnly = true)
    public boolean hasApplied(Long postingId, Long applicantId) {
        Applicant applicant = resolveApplicant(applicantId);
        JobPosting posting = jobPostingRepository.findById(postingId)
                .orElseThrow(() -> new PostingNotFoundException(postingId));
        return applicationRepository.existsByApplicantAndJobPosting(applicant, posting);
    }

    @Transactional(readOnly = true)
    public List<Application> getApplicationsByApplicant(Long applicantId) {
        Applicant applicant = resolveApplicant(applicantId);
        return applicationRepository.findAll().stream()
                .filter(a -> a.getApplicant().getUserId().equals(applicant.getUserId()))
                .toList();
    }

    public Applicant resolveApplicant(Long applicantId) {
        if (applicantId != null) {
            return applicantRepository.findById(applicantId)
                    .orElseThrow(() -> new ApplicantNotFoundException(applicantId));
        }
        // First active applicant or default seed for development/test desk
        return applicantRepository.findAll().stream().findFirst()
                .orElseGet(() -> {
                    Applicant fallback = new Applicant();
                    fallback.setFirstName("Grace");
                    fallback.setLastName("Hopper");
                    fallback.setEmail("grace.hopper@careerbridge.local");
                    fallback.setPhone("254-555-0100");
                    fallback.setAccountStatus(AccountStatus.ACTIVE);
                    return applicantRepository.save(fallback);
                });
    }
}
