package baylor.csi5324.careerbridge.dto;

import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.PostStatus;

import java.time.Instant;
import java.time.LocalDate;

// What the public job board may show (UC-01): who approved a posting and the administrator's
// comments stay inside, and so does the organization's account status.
public record PublicPosting(
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
        // The moment applications stop (UC-13), so the screen need not know the organization's zone
        Instant closesAt,
        PostStatus postStatus,
        PublicOrganization organization
) {
    public record PublicOrganization(Long organizationId, String name) {
    }

    public static PublicPosting of(JobPosting posting) {
        return new PublicPosting(
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
                        posting.getOrganization().getName()));
    }
}
