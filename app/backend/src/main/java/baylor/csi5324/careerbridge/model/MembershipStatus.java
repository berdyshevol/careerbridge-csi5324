package baylor.csi5324.careerbridge.model;

public enum MembershipStatus {
    // UC-08: not in the Administrator's queue until the work email is verified
    AWAITING_VERIFICATION("Awaiting Verification"),
    PENDING("Pending"),
    INFORMATION_REQUESTED("Information Requested"),
    ACTIVE("Active"),
    DENIED("Denied"),
    CANCELLED("Cancelled");

    private final String label;

    MembershipStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public boolean isAwaitingDecision() {
        return this == PENDING || this == INFORMATION_REQUESTED;
    }

    // UC-09 extension 6b: any request not yet decided blocks a second one
    public boolean isOpenRequest() {
        return this == AWAITING_VERIFICATION || isAwaitingDecision();
    }
}
