package baylor.csi5324.careerbridge.model;

import java.util.EnumSet;
import java.util.Set;

// PENDING is the specification's "Extended"; EXPIRED is never stored, an open offer past its
// expirationDate is reported as expired by Offer.isExpired (A14)
public enum OfferStatus {
    PENDING,
    ACCEPTED,
    DECLINED,
    EXPIRED,
    RESCINDED;

    public Set<OfferStatus> allowedMoves() {
        return this == PENDING
                ? EnumSet.of(ACCEPTED, DECLINED, EXPIRED, RESCINDED)
                : EnumSet.noneOf(OfferStatus.class);
    }

    public boolean canMoveTo(OfferStatus next) {
        return allowedMoves().contains(next);
    }
}
