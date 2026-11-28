package baylor.csi5324.careerbridge.model;

import java.time.Instant;
import java.time.ZoneId;

// UC-07 extension 6b (FR-UC07.11): the recruiter revised the offer after the applicant viewed it
public class OfferRevisedException extends RuntimeException {

    private final Offer offer;
    private final Instant checkedAt;
    private final ZoneId organizationZone;

    public OfferRevisedException(Offer offer, Instant checkedAt, ZoneId organizationZone) {
        super("This offer was revised by the recruiter. Review the updated terms before responding.");
        this.offer = offer;
        this.checkedAt = checkedAt;
        this.organizationZone = organizationZone;
    }

    public Offer getOffer() {
        return offer;
    }

    public Instant getCheckedAt() {
        return checkedAt;
    }

    public ZoneId getOrganizationZone() {
        return organizationZone;
    }
}

