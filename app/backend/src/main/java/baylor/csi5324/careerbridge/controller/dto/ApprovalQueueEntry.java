package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.model.MembershipRequestType;
import baylor.csi5324.careerbridge.model.MembershipStatus;
import baylor.csi5324.careerbridge.model.OrganizationMembership;

import java.time.Instant;

// UC-10 step 2: type, requester, organization, submission date and any review flag
public record ApprovalQueueEntry(Long requestId, MembershipRequestType requestType, String requestTypeLabel,
                                 String requesterName, String organizationName, Instant requestedAt,
                                 MembershipStatus status, String statusLabel, String reviewFlag) {

    public static ApprovalQueueEntry from(OrganizationMembership request) {
        return new ApprovalQueueEntry(request.getMembershipId(), request.getRequestType(),
                request.getRequestType().getLabel(),
                request.getRecruiter().getFirstName() + " " + request.getRecruiter().getLastName(),
                request.getOrganization().getName(), request.getRequestedAt(), request.getStatus(),
                request.getStatus().getLabel(), request.getReviewFlag());
    }
}
