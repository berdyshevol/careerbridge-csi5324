package baylor.csi5324.careerbridge.model;

public enum OrganizationStatus {
    PENDING_APPROVAL,
    ACTIVE,
    // UC-10 extension 5a: an organization created only for a denied or cancelled request
    INACTIVE
}
