package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.ApplicationStatus;

// Raised when an applicant action (withdraw, offer response) is no longer allowed for the current stage
public class ApplicationActionRefusedException extends RuntimeException {

    private final ApplicationStatus currentStage;

    public ApplicationActionRefusedException(ApplicationStatus currentStage, String message) {
        super(message);
        this.currentStage = currentStage;
    }

    public ApplicationStatus getCurrentStage() {
        return currentStage;
    }
}

