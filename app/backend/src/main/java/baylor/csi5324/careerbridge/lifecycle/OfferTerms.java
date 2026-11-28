package baylor.csi5324.careerbridge.lifecycle;

import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.Offer;

import java.time.LocalDate;

// What the Recruiter fills in for CO-15.1 extendOffer and CO-15.2 reviseOffer
public record OfferTerms(LocalDate startDate, String salary, String terms, LocalDate expirationDate,
                         String offerLetterFileName) {

    Offer newOffer(Application application, LocalDate dateExtended) {
        return new Offer(application, dateExtended, startDate, salary, terms, expirationDate, offerLetterFileName);
    }

    void applyTo(Offer offer) {
        offer.revise(startDate, salary, terms, expirationDate, offerLetterFileName);
    }
}
