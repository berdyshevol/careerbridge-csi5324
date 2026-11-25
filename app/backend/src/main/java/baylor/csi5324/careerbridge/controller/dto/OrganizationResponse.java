package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.model.Organization;

// What a recruiter or the Administrator sees of an organization; never its approval status
public record OrganizationResponse(Long organizationId, String name, String website, String industry,
                                   String headquarters, String size, String description) {

    public static OrganizationResponse from(Organization organization) {
        return organization == null ? null : new OrganizationResponse(organization.getOrganizationId(),
                organization.getName(), organization.getWebsite(), organization.getIndustry(),
                organization.getHeadquarters(), organization.getSize(), organization.getDescription());
    }
}
