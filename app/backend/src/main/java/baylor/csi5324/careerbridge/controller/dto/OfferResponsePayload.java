package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.service.OfferResponseResult;

public record OfferResponsePayload(ApplicationDetailResponse application,
                                   int activeApplicationCount,
                                   int applicationLimit) {

    public static OfferResponsePayload from(OfferResponseResult result) {
        return new OfferResponsePayload(
                ApplicationDetailResponse.from(result.application(), result.respondedAt()),
                result.activeApplicationCount(),
                result.applicationLimit());
    }
}

