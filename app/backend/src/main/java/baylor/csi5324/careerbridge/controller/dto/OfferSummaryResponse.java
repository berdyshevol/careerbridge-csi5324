package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.model.Offer;
import baylor.csi5324.careerbridge.model.OfferStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

public record OfferSummaryResponse(Long offerId, LocalDate dateExtended, LocalDate startDate,
                                   String salary, String terms, LocalDate expirationDate,
                                   String offerLetterFileName, OfferStatus status,
                                   LocalDate responseDate, int revision,
                                   boolean expired, boolean canRespond) {

    public static OfferSummaryResponse from(Offer offer, Instant now, ZoneId zoneId) {
        boolean expired = offer.isExpired(now, zoneId);
        return new OfferSummaryResponse(
                offer.getOfferId(),
                offer.getDateExtended(),
                offer.getStartDate(),
                offer.getSalary(),
                offer.getTerms(),
                offer.getExpirationDate(),
                offer.getOfferLetterFileName(),
                offer.getStatus(),
                offer.getResponseDate(),
                offer.getRevision(),
                expired,
                offer.canRespond(now, zoneId));
    }
}

