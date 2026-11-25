package baylor.csi5324.careerbridge.controller.dto;

// UC-08 extensions 4b and 4c. For 4c, organization is the registered one the visitor may join instead.
public record RegistrationConflictResponse(Reason reason, String message, OrganizationResponse organization) {

    public enum Reason {
        EMAIL_REGISTERED,
        ORGANIZATION_REGISTERED
    }
}
