package baylor.csi5324.careerbridge.model;

import java.util.EnumSet;
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
