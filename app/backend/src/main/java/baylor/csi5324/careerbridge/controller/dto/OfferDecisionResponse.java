package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.OfferStatus;

import java.time.LocalDate;

public record OfferDecisionResponse(
        Long applicationId,
        ApplicationStatus applicationStatus,
        OfferStatus offerStatus,
        LocalDate responseDate,
        boolean postingClosed,
        long activeApplicationCount) {
}

