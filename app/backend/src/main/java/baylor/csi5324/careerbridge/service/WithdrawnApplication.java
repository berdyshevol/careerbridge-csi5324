package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.Application;

// CO-06.2: withdrawn application and updated active application count
public record WithdrawnApplication(Application application, int activeApplicationCount) {

    public int applicationLimit() {
        return ApplicationService.APPLICATION_LIMIT;
    }
}

