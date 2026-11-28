package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.service.PostingApplicants;

import java.util.List;

public record PostingApplicantsResponse(Long postingId, String title, List<Applicant> applicants) {

    public record Applicant(Long applicationId, String name, ApplicationStatus stage) {
    }

    public static PostingApplicantsResponse from(PostingApplicants view) {
        return new PostingApplicantsResponse(view.posting().getJobPostId(), view.posting().getTitle(),
                view.applicants().stream()
                        .map(applicant -> new Applicant(applicant.applicationId(), applicant.name(), applicant.stage()))
                        .toList());
    }
}
