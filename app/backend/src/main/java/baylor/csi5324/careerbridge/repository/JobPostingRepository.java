package baylor.csi5324.careerbridge.repository;

import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.PostStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface JobPostingRepository extends JpaRepository<JobPosting, Long> {

    List<JobPosting> findByPostStatusAndApplicationDeadlineGreaterThanEqualOrderByDatePostedDesc(
            PostStatus postStatus, LocalDate today);

    List<JobPosting> findByPostStatusOrderByDatePostedAscJobPostIdAsc(PostStatus postStatus);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<JobPosting> findWithLockByJobPostId(Long jobPostId);
}
