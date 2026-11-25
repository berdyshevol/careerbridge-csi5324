package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.service.WithdrawnApplication;

public record WithdrawalResponse(ApplicationDetailResponse application,
                                 int activeApplicationCount,
                                 int applicationLimit) {

    public static WithdrawalResponse from(WithdrawnApplication result) {
        return new WithdrawalResponse(
                ApplicationDetailResponse.from(result.application()),
                result.activeApplicationCount(),
                result.applicationLimit());
    }
}

