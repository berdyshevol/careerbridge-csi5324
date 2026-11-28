package baylor.csi5324.careerbridge.model;

import java.util.EnumSet;
import java.util.Optional;
import java.util.Set;

public enum ApplicationStatus {
    APPLIED,
    SCREENING,
    INTERVIEW,
    OFFER,
    HIRED,
    REJECTED,
    WITHDRAWN,
    OFFER_DECLINED;

    // The stages that count toward the limit of 5 (BR-4, A7)
    public static final Set<ApplicationStatus> ACTIVE =
            EnumSet.of(APPLIED, SCREENING, INTERVIEW, OFFER);

    public boolean isActive() {
        return ACTIVE.contains(this);
    }

    // BR-8, fig-03: the whole pipeline. Every stage change in Application asks this method, so a
    // move that is not drawn here cannot happen, whatever a service or a fixture tries
    public Set<ApplicationStatus> allowedMoves() {
        return switch (this) {
            case APPLIED -> EnumSet.of(SCREENING, REJECTED, WITHDRAWN);
            case SCREENING -> EnumSet.of(INTERVIEW, REJECTED, WITHDRAWN);
            case INTERVIEW -> EnumSet.of(OFFER, REJECTED, WITHDRAWN);
            case OFFER -> EnumSet.of(HIRED, OFFER_DECLINED, REJECTED);
            case HIRED, REJECTED, WITHDRAWN, OFFER_DECLINED -> EnumSet.noneOf(ApplicationStatus.class);
        };
    }

    public boolean canMoveTo(ApplicationStatus next) {
        return allowedMoves().contains(next);
    }

    // CO-14.2: advancing is the forward move a recruiter makes by hand; from Interview the next
    // stage is reached only by extending an offer (UC-15), which needs offer terms
    public Optional<ApplicationStatus> nextStage() {
        return switch (this) {
            case APPLIED -> Optional.of(SCREENING);
            case SCREENING -> Optional.of(INTERVIEW);
            default -> Optional.empty();
        };
    }


    public String getLabel() {
        return switch (this) {
            case APPLIED -> "Applied";
            case SCREENING -> "Screening";
            case INTERVIEW -> "Interview";
            case OFFER -> "Offer";
            case HIRED -> "Hired";
            case REJECTED -> "Rejected";
            case WITHDRAWN -> "Withdrawn";
            case OFFER_DECLINED -> "Offer Declined";
        };
    }
}
