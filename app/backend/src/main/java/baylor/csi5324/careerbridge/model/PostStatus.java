package baylor.csi5324.careerbridge.model;

import java.util.EnumSet;
import java.util.Set;

public enum PostStatus {
    DRAFT("Draft"),
    PENDING_APPROVAL("Pending Approval"),
    RETURNED("Returned"),
    PUBLISHED("Published"),
    CLOSED("Closed"),
    REJECTED("Rejected"),
    EXPIRED("Expired");

    private final String label;

    PostStatus(String label) {
        this.label = label;
    }

    // fig-04 (BR-9, BR-10, A9): the whole lifecycle; every status change in JobPosting asks this method
    public Set<PostStatus> allowedMoves() {
        return switch (this) {
            case DRAFT -> EnumSet.of(PENDING_APPROVAL);
            case PENDING_APPROVAL -> EnumSet.of(PUBLISHED, RETURNED, REJECTED, EXPIRED);
            case RETURNED -> EnumSet.of(PENDING_APPROVAL, EXPIRED);
            case PUBLISHED -> EnumSet.of(CLOSED);
            case CLOSED, REJECTED, EXPIRED -> EnumSet.noneOf(PostStatus.class);
        };
    }

    public boolean canMoveTo(PostStatus next) {
        return allowedMoves().contains(next);
    }

    // Only before the Administrator has it does the Recruiter change or submit a posting (UC-11)
    public boolean isEditable() {
        return canMoveTo(PENDING_APPROVAL);
    }

    public String getLabel() {
        return label;
    }

    public static PostStatus fromLabel(String label) {
        for (PostStatus status : values()) {
            if (status.label.equalsIgnoreCase(label.trim())) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown post status: " + label);
    }
}
