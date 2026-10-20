package baylor.csi5324.careerbridge.repository;

import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.PostStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface JobPostingRepository extends JpaRepository<JobPosting, Long> {

    // Approval stamps datePosted with today, so postings approved the same day need the id to keep a fixed order
    List<JobPosting> findByPostStatusAndApplicationDeadlineGreaterThanEqualOrderByDatePostedDescJobPostIdDesc(
            PostStatus postStatus, LocalDate today);

    List<JobPosting> findByPostStatusOrderByDatePostedAscJobPostIdAsc(PostStatus postStatus);
}
