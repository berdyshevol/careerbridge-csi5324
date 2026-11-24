package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.service.WithdrawalPrompt;

import java.util.List;

public record WithdrawalPromptResponse(Long applicationId, String title, String organizationName,
                                       ApplicationStatus applicationStatus, String warning,
                                       List<String> reasons) {

    public static WithdrawalPromptResponse from(WithdrawalPrompt prompt) {
        var application = prompt.application();
        var posting = application.getJobPosting();
        return new WithdrawalPromptResponse(
                application.getApplicationId(),
                posting.getTitle(),
                posting.getOrganization().getName(),
                application.getApplicationStatus(),
                prompt.warning(),
                prompt.reasons());
    }
}

