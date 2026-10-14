package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.ResumeSnapshot;
import baylor.csi5324.careerbridge.repository.ApplicantRepository;
import baylor.csi5324.careerbridge.repository.ApplicationRepository;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@Transactional
public class ApplicationService {

    public static final int APPLICATION_LIMIT = 5;

    // STAND-IN: nobody can log in yet, so every application comes from the sample
    // applicant whose desk the frontend shows (src/lib/sampleDesk.ts). Log In replaces it.
    public static final String SAMPLE_APPLICANT_EMAIL = "jordan.lee@example.com";

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

        Applicant applicant = applicantRepository.findByEmail(SAMPLE_APPLICANT_EMAIL)
                .orElseThrow(() -> new IllegalStateException("The sample applicant was not loaded"));
        if (applicationRepository.existsByApplicantAndJobPosting(applicant, posting)) {
            throw new ApplicationRefusedException(
                    "You already applied to this posting. A posting can be applied to once.");
        }
        long active = applicationRepository.countActiveByApplicant(applicant);
        if (active >= APPLICATION_LIMIT) {
            throw new ApplicationRefusedException("You have " + APPLICATION_LIMIT
                    + " active applications, the most allowed at once. A slot frees up when you "
                    + "withdraw one or it reaches Hired, Rejected or Offer Declined.");
        }

        Application application = applicationRepository.save(
                new Application(applicant, posting, resume, today));
        return new SubmittedApplication(application, active + 1);
    }
}
