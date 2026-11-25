package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.model.MembershipStatus;
import baylor.csi5324.careerbridge.model.OrganizationMembership;

import java.time.Instant;

// One of the recruiter's memberships (UC-09 steps 4 and 8); the decision note tells a denial's reason
public record MembershipResponse(Long membershipId, OrganizationResponse organization, MembershipStatus status,
                                 String statusLabel, String role, Instant requestedAt, Instant approvedAt,
                                 String decisionNote) {

    public static MembershipResponse from(OrganizationMembership membership) {
        return new MembershipResponse(membership.getMembershipId(),
                OrganizationResponse.from(membership.getOrganization()), membership.getStatus(),
                membership.getStatus().getLabel(), membership.getRole(), membership.getRequestedAt(),
                membership.getApprovedAt(), membership.getDecisionNote());
    }
}
