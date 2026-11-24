package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.Application;

import java.util.List;

// CO-05.1: the applicant's applications (active first) together with the active count
public record ApplicantApplications(List<Application> applications, int activeApplicationCount) {

    public int applicationLimit() {
        return ApplicationService.APPLICATION_LIMIT;
    }
}

