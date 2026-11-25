package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record ApplicationDetailResponse(Long applicationId, Long postingId, String title,
                                        String organizationName, String location,
                                        String employmentType, ApplicationStatus applicationStatus,
                                        LocalDate dateApplied,
                                        List<StatusHistoryEntryResponse> statusHistory,
                                        List<InterviewSummaryResponse> interviews,
                                        OfferSummaryResponse offer,
                                        String rejectionReason, ApplicationStatus rejectedAtStage,
                                        LocalDate rejectionDate, Instant withdrawnAt,
                                        List<String> availableActions) {

    public static ApplicationDetailResponse from(Application application) {
        return from(application, Instant.now());
    }

    public static ApplicationDetailResponse from(Application application, Instant now) {
        var posting = application.getJobPosting();
        var zoneId = posting.getOrganization().getZoneId();
        OfferSummaryResponse offerSummary = application.getOffer() == null
                ? null
                : OfferSummaryResponse.from(application.getOffer(), now, zoneId);
        return new ApplicationDetailResponse(
                application.getApplicationId(),
                posting.getJobPostId(),
                posting.getTitle(),
                posting.getOrganization().getName(),
                posting.getLocation(),
                posting.getEmploymentType(),
                application.getApplicationStatus(),
                application.getDateApplied(),
                application.getStatusHistory().stream().map(StatusHistoryEntryResponse::from).toList(),
                application.getInterviews().stream().map(InterviewSummaryResponse::from).toList(),
                offerSummary,
                application.getRejectionReason(),
                application.getRejectedAtStage(),
                application.getRejectionDate(),
                application.getWithdrawnAt(),
                application.availableActions(now));
    }
}
