package baylor.csi5324.careerbridge.model;

import java.time.LocalDate;

// The offerTerms of CO-15.1 and CO-15.2: what a recruiter fills in, extending or revising alike
public record OfferTerms(LocalDate startDate, String salary, String terms, LocalDate expirationDate,
                         String offerLetterFileName) {
}
