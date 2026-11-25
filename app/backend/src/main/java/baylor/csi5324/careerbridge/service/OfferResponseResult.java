package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.Application;

import java.time.Instant;

// CO-07.2 / CO-07.3 result: updated application and active-slot count after accepting or declining an offer
public record OfferResponseResult(Application application, int activeApplicationCount, Instant respondedAt) {

    public int applicationLimit() {
        return ApplicationService.APPLICATION_LIMIT;
    }
}
