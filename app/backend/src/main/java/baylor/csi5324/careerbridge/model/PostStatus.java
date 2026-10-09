package baylor.csi5324.careerbridge.model;

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
