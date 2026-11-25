package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.service.OrganizationData;

// CO-09.1: organizationId of a registered organization, or organization for a new one (extension 3a)
public record MembershipRequestBody(Long organizationId, OrganizationData organization, String role,
                                    String justification) {
}
