package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.service.SubmittedApplication;

public record ApplicationResponse(Long applicationId, ApplicationStatus applicationStatus,
                                  long activeApplicationCount) {

    public static ApplicationResponse from(SubmittedApplication submitted) {
        return new ApplicationResponse(
                submitted.application().getApplicationId(),
                submitted.application().getApplicationStatus(),
                submitted.activeApplicationCount());
    }
}
