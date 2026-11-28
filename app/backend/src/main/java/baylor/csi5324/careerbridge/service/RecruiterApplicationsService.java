package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.ResumeSnapshot;
import baylor.csi5324.careerbridge.repository.ApplicationRepository;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

// UC-14 steps 3-4: a posting's applicants, and CO-14.1 reviewApplication. Every read answers "not found"
// for a posting or application outside the organization the recruiter acts for, whether it exists or not
// (BR-15, FR-UC14.9), so a recruiter cannot learn which ids are taken.
@Service
public class RecruiterApplicationsService {

    private final RecruiterOrganization recruiterOrganization;
    private final JobPostingRepository jobPostingRepository;
    private final ApplicationRepository applicationRepository;

    public RecruiterApplicationsService(RecruiterOrganization recruiterOrganization,
                                        JobPostingRepository jobPostingRepository,
                                        ApplicationRepository applicationRepository) {
        this.recruiterOrganization = recruiterOrganization;
        this.jobPostingRepository = jobPostingRepository;
        this.applicationRepository = applicationRepository;
    }

    @Transactional(readOnly = true)
    public PostingApplicants viewPosting(String recruiterEmail, Long postingId) {
        JobPosting posting = jobPostingRepository.findById(postingId)
                .filter(found -> actsFor(recruiterEmail, found.getOrganization()))
                .orElseThrow(() -> new PostingNotFoundException(postingId));

        List<PostingApplicants.Applicant> applicants = applicationRepository
                .findByJobPostingAndApplicationStatusIn(posting, ApplicationStatus.ACTIVE).stream()
                .sorted(Comparator.comparing(Application::getApplicationStatus)
                        .thenComparing(Application::getDateApplied)
                        .thenComparing(Application::getApplicationId))
                .map(application -> new PostingApplicants.Applicant(application.getApplicationId(),
                        nameOf(application), application.getApplicationStatus()))
                .toList();
        return new PostingApplicants(posting, applicants);
    }

    @Transactional(readOnly = true)
    public ApplicationReview reviewApplication(String recruiterEmail, Long applicationId) {
        Application application = ownApplication(recruiterEmail, applicationId);
        return new ApplicationReview(application.getApplicationId(), application.getJobPosting().getJobPostId(),
                application.getJobPosting().getTitle(), nameOf(application), application.getApplicationStatus(),
                application.getApplicant(), application.getResumeSnapshot(),
                List.copyOf(application.getStatusHistory()));
    }

    // The copy the applicant sent with this application (A6), for the recruiter to download
    @Transactional(readOnly = true)
    public ResumeSnapshot resumeOf(String recruiterEmail, Long applicationId) {
        return ownApplication(recruiterEmail, applicationId).getResumeSnapshot();
    }

    private Application ownApplication(String recruiterEmail, Long applicationId) {
        return applicationRepository.findWithDetailsByApplicationId(applicationId)
                .filter(found -> actsFor(recruiterEmail, found.getJobPosting().getOrganization()))
                .orElseThrow(() -> new ApplicationNotFoundException(applicationId));
    }

    private boolean actsFor(String recruiterEmail, Organization organization) {
        return recruiterOrganization.activeOrganizationOf(recruiterEmail)
                .map(acting -> acting.getOrganizationId().equals(organization.getOrganizationId()))
                .orElse(false);
    }

    private static String nameOf(Application application) {
        return application.getApplicant().getFirstName() + " " + application.getApplicant().getLastName();
    }
}
