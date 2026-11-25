package baylor.csi5324.careerbridge.repository;

import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.JobPosting;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    // Fetches the posting, its organization and stage history with each row; the list shows all three (CO-05.1)
    @EntityGraph(attributePaths = {"jobPosting", "jobPosting.organization", "statusHistory"})
    List<Application> findByApplicant(Applicant applicant);

    @EntityGraph(attributePaths = {"applicant", "jobPosting", "jobPosting.organization", "statusHistory"})
    Optional<Application> findWithDetailsByApplicationId(Long applicationId);

    // Row lock without outer-join fetch so PostgreSQL accepts FOR UPDATE during state transitions (CO-06.2, CO-07.2)
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Application a WHERE a.applicationId = :applicationId")
    Optional<Application> findByIdForUpdate(@Param("applicationId") Long applicationId);

    @EntityGraph(attributePaths = {"jobPosting", "jobPosting.organization", "statusHistory"})
    List<Application> findByApplicantAndApplicationStatusIn(Applicant applicant,
                                                            Collection<ApplicationStatus> statuses);

    long countByApplicantAndApplicationStatusIn(Applicant applicant,
                                                Collection<ApplicationStatus> statuses);

    default long countActiveByApplicant(Applicant applicant) {
        return countByApplicantAndApplicationStatusIn(applicant, ApplicationStatus.ACTIVE);
    }

    // Any status counts, so a withdrawn application still blocks applying again (A5)
    boolean existsByApplicantAndJobPosting(Applicant applicant, JobPosting jobPosting);
}
