
package baylor.csi5324.careerbridge.repository;

import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.PostStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

@Repository
public interface JobPostingRepository extends JpaRepository<JobPosting, Long> {

    List<JobPosting> findByPostStatusAndApplicationDeadlineGreaterThanEqualOrderByDatePostedDesc(
            PostStatus postStatus, LocalDate today);

    List<JobPosting> findByPostStatusOrderByDatePostedAscJobPostIdAsc(
            PostStatus postStatus);

    // UC-13: Include closed and expired postings in the recruiter's organization view.
    // Access control must be enforced by the service/controller before exposing results.
    List<JobPosting> findByOrganizationOrganizationIdOrderByDatePostedDescJobPostIdDesc(
            Long organizationId);

    // UC-13: Select only potentially overdue postings.
    // The expiration processor still checks the organization's exact local deadline.
    List<JobPosting> findByPostStatusInAndApplicationDeadlineLessThanEqual(
            Collection<PostStatus> statuses,
            LocalDate latestPossibleExpiredDeadline);
}
