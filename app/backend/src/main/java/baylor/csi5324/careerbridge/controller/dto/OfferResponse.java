package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Offer;
import baylor.csi5324.careerbridge.model.OfferStatus;
import baylor.csi5324.careerbridge.model.PostStatus;

import java.time.LocalDate;

public record OfferResponse(
        Long offerId,
        Long applicationId,
        Long postingId,
        String title,
        String organizationName,
        String location,
        String employmentType,
        ApplicationStatus applicationStatus,
        LocalDate dateExtended,
        LocalDate expirationDate,
        LocalDate startDate,
        String salary,
        String terms,
        OfferStatus status,
        LocalDate responseDate,
        boolean open) {

    public static OfferResponse from(Application application) {
        Offer offer = application.getOffer();
        if (offer == null) {
            return null;
        }
        JobPosting posting = application.getJobPosting();
        LocalDate today = LocalDate.now();
        boolean isOpen = application.getApplicationStatus() == ApplicationStatus.OFFER
                && offer.getStatus() == OfferStatus.EXTENDED
                && posting.getPostStatus() == PostStatus.PUBLISHED
                && offer.getExpirationDate() != null
                && !offer.getExpirationDate().isBefore(today);

        return new OfferResponse(
                offer.getOfferId(),
                application.getApplicationId(),
                posting.getJobPostId(),
                posting.getTitle(),
                posting.getOrganization().getName(),
                posting.getLocation(),
                posting.getEmploymentType(),
                application.getApplicationStatus(),
                offer.getDateExtended(),
                offer.getExpirationDate(),
                offer.getStartDate(),
                offer.getSalary(),
                offer.getTerms(),
                offer.getStatus(),
                offer.getResponseDate(),
                isOpen);
    }
}

