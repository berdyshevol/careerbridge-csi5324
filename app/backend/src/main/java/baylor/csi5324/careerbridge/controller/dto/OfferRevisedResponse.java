package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.model.OfferRevisedException;

// UC-07 ext 6b (FR-UC07.11): returns the revised offer terms so the applicant can review and confirm again
public record OfferRevisedResponse(String code, String message, OfferSummaryResponse offer) {

    public static OfferRevisedResponse from(OfferRevisedException revised) {
        return new OfferRevisedResponse(
                "OFFER_REVISED",
                revised.getMessage(),
                OfferSummaryResponse.from(
                        revised.getOffer(), revised.getCheckedAt(), revised.getOrganizationZone()));
    }
}

