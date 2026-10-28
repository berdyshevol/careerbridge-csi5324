package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.service.ApplicationService;
import baylor.csi5324.careerbridge.service.ApplicationStart;

import java.util.List;

public record ApplicationStartResponse(PostingSummary posting, ApplicantContact applicant,
                                       ResumeResponse resume,
                                       List<ApplicationSummaryResponse> activeApplications,
                                       long activeApplicationCount, int applicationLimit,
                                       RefusalResponse refusal) {

    public record PostingSummary(Long postingId, String title, String organizationName) {
    }

    public record ApplicantContact(String firstName, String lastName, String email, String phone) {
    }

    public static ApplicationStartResponse from(ApplicationStart start) {
        var posting = start.posting();
        var applicant = start.applicant();
        return new ApplicationStartResponse(
                new PostingSummary(posting.getJobPostId(), posting.getTitle(),
                        posting.getOrganization().getName()),
                new ApplicantContact(applicant.getFirstName(), applicant.getLastName(),
                        applicant.getEmail(), applicant.getPhone()),
                ResumeResponse.from(start.resume()),
                start.activeApplications().stream().map(ApplicationSummaryResponse::from).toList(),
                start.activeApplicationCount(),
                ApplicationService.APPLICATION_LIMIT,
                start.refusal() == null ? null : RefusalResponse.of(start.refusal()));
    }
}
