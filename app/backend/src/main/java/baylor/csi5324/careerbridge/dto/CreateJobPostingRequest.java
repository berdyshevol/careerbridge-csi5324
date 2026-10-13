
package baylor.csi5324.careerbridge.dto;

import java.time.LocalDate;

public record CreateJobPostingRequest(
        Long organizationId,
        String title,
        String description,
        String jobRequirements,
        String location,
        String employmentType,
        String salaryRange,
        int numberOfOpenings,
        LocalDate applicationDeadline
) {
}

