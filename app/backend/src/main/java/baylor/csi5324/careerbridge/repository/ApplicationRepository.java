package baylor.csi5324.careerbridge.repository;

import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.JobPosting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    long countByApplicantAndApplicationStatusIn(Applicant applicant,
                                                Collection<ApplicationStatus> statuses);

    default long countActiveByApplicant(Applicant applicant) {
        return countByApplicantAndApplicationStatusIn(applicant, ApplicationStatus.ACTIVE);
    }

    // Any status counts, so a withdrawn application still blocks applying again (A5)
    boolean existsByApplicantAndJobPosting(Applicant applicant, JobPosting jobPosting);
}
