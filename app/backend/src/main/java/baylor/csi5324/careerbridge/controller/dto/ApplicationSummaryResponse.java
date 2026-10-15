package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;

public record ApplicationSummaryResponse(Long applicationId, Long postingId, String title,
                                        String organizationName, String location,
                                        String employmentType, ApplicationStatus applicationStatus) {

    public static ApplicationSummaryResponse from(Application application) {
        var posting = application.getJobPosting();
        return new ApplicationSummaryResponse(
                application.getApplicationId(),
                posting.getJobPostId(),
                posting.getTitle(),
                posting.getOrganization().getName(),
                posting.getLocation(),
                posting.getEmploymentType(),
                application.getApplicationStatus());
    }
}
