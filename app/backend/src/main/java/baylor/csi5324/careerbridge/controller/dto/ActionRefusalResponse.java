package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.service.ApplicationActionRefusedException;

public record ActionRefusalResponse(ApplicationStatus currentStage, String message) {

    public static ActionRefusalResponse from(ApplicationActionRefusedException refused) {
        return new ActionRefusalResponse(refused.getCurrentStage(), refused.getMessage());
    }
}

