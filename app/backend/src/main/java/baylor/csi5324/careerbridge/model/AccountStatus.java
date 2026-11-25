package baylor.csi5324.careerbridge.model;

public enum AccountStatus {
    PENDING_VERIFICATION,
    // UC-08: a recruiter waits for the Administrator (BR-14)
    PENDING_APPROVAL,
    ACTIVE,
    // UC-10 extension 5a: an account created only for a denied request
    INACTIVE
}
