package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.service.ApplicantApplications;

import java.util.List;

public record ApplicantApplicationsResponse(List<ApplicationSummaryResponse> applications,
                                            int activeApplicationCount,
                                            int applicationLimit) {

    public static ApplicantApplicationsResponse from(ApplicantApplications result) {
        return new ApplicantApplicationsResponse(
                result.applications().stream().map(ApplicationSummaryResponse::from).toList(),
                result.activeApplicationCount(),
                result.applicationLimit());
    }
}

