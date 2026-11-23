package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.service.RecruiterRegistration;

public record RecruiterRegistrationResponse(String email, String organizationName, boolean joinsExistingOrganization,
                                            String verificationLink) {

    public static RecruiterRegistrationResponse from(RecruiterRegistration registration) {
        var membership = registration.membership();
        return new RecruiterRegistrationResponse(membership.getRecruiter().getEmail(),
                membership.getOrganization().getName(), !membership.getRequestType().createsOrganization(),
                registration.verificationLink());
    }
}
