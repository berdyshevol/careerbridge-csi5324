package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.JobPosting;

public record WithdrawalRequestResponse(
        Long applicationId,
        Long postingId,
        String title,
        String organizationName,
        ApplicationStatus applicationStatus,
        String warning) {

    public static final String FINAL_WITHDRAWAL_WARNING =
            "Withdrawal is final and cannot be undone. You cannot apply to this posting again after withdrawing.";

    public static WithdrawalRequestResponse from(Application application) {
        JobPosting posting = application.getJobPosting();
        return new WithdrawalRequestResponse(
                application.getApplicationId(),
                posting.getJobPostId(),
                posting.getTitle(),
                posting.getOrganization().getName(),
                application.getApplicationStatus(),
                FINAL_WITHDRAWAL_WARNING);
    }
}

