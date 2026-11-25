package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.service.RecruiterPostings;

import java.util.List;
import java.util.Map;

public record RecruiterPostingsResponse(Long organizationId, String organizationName, List<Posting> postings) {

    public record Posting(Long postingId, String title, String postStatus, String closingReason,
                          Map<ApplicationStatus, Long> applicationsByStage, boolean createdByYou) {

        static Posting from(RecruiterPostings.RecruiterPosting row) {
            JobPosting posting = row.posting();
            return new Posting(posting.getJobPostId(), posting.getTitle(), posting.getPostStatus().name(),
                    posting.getClosingReason(), row.applicationsByStage(), row.createdByYou());
        }
    }

    public static RecruiterPostingsResponse from(RecruiterPostings postings) {
        return new RecruiterPostingsResponse(
                postings.organization() == null ? null : postings.organization().getOrganizationId(),
                postings.organization() == null ? null : postings.organization().getName(),
                postings.postings().stream().map(Posting::from).toList());
    }
}
