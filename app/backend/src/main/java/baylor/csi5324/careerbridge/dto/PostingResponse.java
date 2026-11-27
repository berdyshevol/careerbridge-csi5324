package baylor.csi5324.careerbridge.dto;

import baylor.csi5324.careerbridge.dto.PublicPosting.PublicOrganization;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.PostStatus;

import java.time.Instant;
import java.time.LocalDate;

// What the recruiter and the administrator see of a posting they work on: the public details and
// the Administrator's comment and closing reason. A field added to JobPosting stays inside until
// it is added here.
public record PostingResponse(
        Long jobPostId,
        String title,
        String description,
        String jobRequirements,
        String location,
        String employmentType,
        String salaryRange,
        int numberOfOpenings,
        LocalDate datePosted,
        LocalDate applicationDeadline,
        Instant closesAt,
        PostStatus postStatus,
        PublicOrganization organization,
        String reviewComment,
        String closingReason
) {
    public static PostingResponse of(JobPosting posting) {
        return new PostingResponse(
                posting.getJobPostId(),
                posting.getTitle(),
                posting.getDescription(),
                posting.getJobRequirements(),
                posting.getLocation(),
                posting.getEmploymentType(),
                posting.getSalaryRange(),
                posting.getNumberOfOpenings(),
                posting.getDatePosted(),
                posting.getApplicationDeadline(),
                posting.closesAt(),
                posting.getPostStatus(),
                new PublicOrganization(
                        posting.getOrganization().getOrganizationId(),
                        posting.getOrganization().getName()),
                posting.getReviewComment(),
                posting.getClosingReason());
    }
}
