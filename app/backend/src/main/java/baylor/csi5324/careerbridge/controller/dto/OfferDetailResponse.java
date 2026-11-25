package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.Offer;
import baylor.csi5324.careerbridge.model.OfferStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

// CO-07.1 response: full offer details for an application at the Offer stage
public record OfferDetailResponse(Long offerId, Long applicationId, Long postingId, String title,
                                  String organizationName, LocalDate dateExtended,
                                  LocalDate startDate, String salary, String terms,
                                  LocalDate expirationDate, String offerLetterFileName,
                                  OfferStatus status, LocalDate responseDate, int revision,
                                  boolean expired, boolean canRespond) {

    public static OfferDetailResponse from(Application application, Instant now) {
        Offer offer = application.getOffer();
        var posting = application.getJobPosting();
        ZoneId zoneId = posting.getOrganization().getZoneId();
        return new OfferDetailResponse(
                offer.getOfferId(),
                application.getApplicationId(),
                posting.getJobPostId(),
                posting.getTitle(),
                posting.getOrganization().getName(),
                offer.getDateExtended(),
                offer.getStartDate(),
                offer.getSalary(),
                offer.getTerms(),
                offer.getExpirationDate(),
                offer.getOfferLetterFileName(),
                offer.getStatus(),
                offer.getResponseDate(),
                offer.getRevision(),
                offer.isExpired(now, zoneId),
                offer.canRespond(now, zoneId));
    }
}

