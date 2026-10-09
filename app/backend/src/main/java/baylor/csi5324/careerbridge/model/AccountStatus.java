package baylor.csi5324.careerbridge.model;

/**
 * Values of a User's account Status named in the operation contracts
 * (documentation, section 4.3: CO-02.1, CO-02.2, CO-08.1, CO-10.1).
 */
public enum AccountStatus {
    PENDING_VERIFICATION("Pending Verification"),
    PENDING_APPROVAL("Pending Approval"),
    ACTIVE("Active");

    private final String label;

    AccountStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
