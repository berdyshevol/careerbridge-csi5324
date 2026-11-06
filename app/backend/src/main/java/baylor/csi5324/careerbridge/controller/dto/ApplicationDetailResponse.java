package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.StatusHistoryEntry;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record ApplicationDetailResponse(
        Long applicationId,
        Long postingId,
        String title,
        String organizationName,
        String location,
        String employmentType,
        LocalDate dateApplied,
        ApplicationStatus applicationStatus,
        LocalDate lastUpdatedDate,
        String rejectionReason,
        ApplicationStatus rejectedAtStage,
        LocalDate rejectionDate,
        Instant withdrawnAt,
        String withdrawalReason,
        List<StatusHistoryEntryResponse> statusHistory,
        List<InterviewSummaryResponse> interviews,
        OfferResponse offer,
        List<String> availableActions,
        long activeApplicationCount) {

    public static ApplicationDetailResponse from(Application application, long activeApplicationCount) {
        JobPosting posting = application.getJobPosting();
        List<StatusHistoryEntry> history = application.getStatusHistory();

        ApplicationStatus rejectedAt = null;
        LocalDate rejectedOn = null;
        if (application.getApplicationStatus() == ApplicationStatus.REJECTED) {
            rejectedOn = application.getLastUpdatedDate();
            rejectedAt = ApplicationStatus.APPLIED;
            for (int i = history.size() - 1; i >= 0; i--) {
                ApplicationStatus stage = history.get(i).getStatus();
                if (stage != ApplicationStatus.REJECTED) {
                    rejectedAt = stage;
                    break;
                }
            }
        }

        String withdrawalReason = null;
        if (application.getApplicationStatus() == ApplicationStatus.WITHDRAWN && !history.isEmpty()) {
            withdrawalReason = history.get(history.size() - 1).getReason();
        }

        List<String> actions;
        if (application.canWithdraw()) {
            actions = List.of("WITHDRAW");
        } else if (application.getApplicationStatus() == ApplicationStatus.OFFER) {
            actions = List.of("ACCEPT_OFFER", "DECLINE_OFFER");
        } else {
            actions = List.of();
        }

        return new ApplicationDetailResponse(
                application.getApplicationId(),
                posting.getJobPostId(),
                posting.getTitle(),
                posting.getOrganization().getName(),
                posting.getLocation(),
                posting.getEmploymentType(),
                application.getDateApplied(),
                application.getApplicationStatus(),
                application.getLastUpdatedDate(),
                application.getRejectionReason(),
                rejectedAt,
                rejectedOn,
                application.getWithdrawnAt(),
                withdrawalReason,
                history.stream().map(StatusHistoryEntryResponse::from).toList(),
                application.getInterviews().stream().map(InterviewSummaryResponse::from).toList(),
                OfferResponse.from(application),
                actions,
                activeApplicationCount);
    }
}

