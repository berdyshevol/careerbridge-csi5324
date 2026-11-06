package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.JobPosting;

import java.time.LocalDate;

public record ApplicationSummaryResponse(
        Long applicationId,
        Long postingId,
        String title,
        String organizationName,
        String location,
        String employmentType,
        LocalDate dateApplied,
        ApplicationStatus applicationStatus,
        LocalDate lastUpdatedDate,
        boolean active) {

    public static ApplicationSummaryResponse from(Application application) {
        JobPosting posting = application.getJobPosting();
        return new ApplicationSummaryResponse(
                application.getApplicationId(),
                posting.getJobPostId(),
                posting.getTitle(),
                posting.getOrganization().getName(),
                posting.getLocation(),
                posting.getEmploymentType(),
                application.getDateApplied(),
                application.getApplicationStatus(),
                application.getLastUpdatedDate(),
                application.isActive());
    }
}

