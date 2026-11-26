package baylor.csi5324.careerbridge.repository;

import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.PostStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface JobPostingRepository extends JpaRepository<JobPosting, Long> {

    // Serializes concurrent offer acceptances on the same posting so hires never exceed openings (FR-UC07.10, A2)
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM JobPosting p WHERE p.jobPostId = :jobPostId")
    Optional<JobPosting> findByIdForUpdate(@Param("jobPostId") Long jobPostId);

    // Approval stamps datePosted with today, so postings approved the same day need the id to keep a fixed order
    List<JobPosting> findByPostStatusAndApplicationDeadlineGreaterThanEqualOrderByDatePostedDescJobPostIdDesc(
            PostStatus postStatus, LocalDate today);

    // UC-14 step 2: every posting of the organization, in any status
    List<JobPosting> findByOrganizationOrderByDatePostedDescJobPostIdDesc(Organization organization);

    // A demo posting is added only once (config/DemoPostings.java)
    Optional<JobPosting> findFirstByOrganizationAndTitleIgnoreCase(Organization organization, String title);

    List<JobPosting> findByPostStatusOrderByDatePostedAscJobPostIdAsc(PostStatus postStatus);

    // UC-13: a coarse cut by date; the expiration processor decides each posting in its organization's zone
    List<JobPosting> findByPostStatusInAndApplicationDeadlineLessThanEqual(
            Collection<PostStatus> statuses, LocalDate latestPossibleExpiredDeadline);
}
