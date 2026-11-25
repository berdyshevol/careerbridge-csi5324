package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.service.OrganizationData;
import baylor.csi5324.careerbridge.service.RecruiterData;

// UC-08 step 3. joinOrganizationId instead of organization once the visitor accepted extension 4c.
public record RecruiterRegistrationRequest(String fullName, String jobTitle, String email, String phone,
                                           String password, OrganizationData organization,
                                           Long joinOrganizationId) {

    public RecruiterData recruiter() {
        return new RecruiterData(fullName, jobTitle, email, phone, password);
    }
}
