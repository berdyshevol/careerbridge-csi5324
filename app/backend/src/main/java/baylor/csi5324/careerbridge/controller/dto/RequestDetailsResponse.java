package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.model.MembershipRequestType;
import baylor.csi5324.careerbridge.model.MembershipStatus;
import baylor.csi5324.careerbridge.model.OrganizationMembership;
import baylor.csi5324.careerbridge.model.Recruiter;
import baylor.csi5324.careerbridge.service.MembershipRequestDetails;

import java.time.Instant;
import java.util.List;

// UC-10 step 4
public record RequestDetailsResponse(Long requestId, MembershipRequestType requestType, String requestTypeLabel,
                                     MembershipStatus status, String statusLabel, Instant requestedAt,
                                     String reviewFlag, Requester requester, List<MembershipResponse> memberships,
                                     OrganizationResponse organization, String role, String justification,
                                     String decisionNote, OrganizationResponse duplicateOf) {

    public record Requester(String name, String email, String jobTitle, String phone) {
    }

    public static RequestDetailsResponse from(MembershipRequestDetails details) {
        OrganizationMembership request = details.request();
        Recruiter recruiter = request.getRecruiter();
        return new RequestDetailsResponse(request.getMembershipId(), request.getRequestType(),
                request.getRequestType().getLabel(), request.getStatus(), request.getStatus().getLabel(),
                request.getRequestedAt(), request.getReviewFlag(),
                new Requester(recruiter.getFirstName() + " " + recruiter.getLastName(), recruiter.getEmail(),
                        recruiter.getJobTitle(), recruiter.getPhone()),
                details.otherMemberships().stream().map(MembershipResponse::from).toList(),
                OrganizationResponse.from(request.getOrganization()), request.getRole(), request.getJustification(),
                request.getDecisionNote(), OrganizationResponse.from(details.duplicateOf()));
    }
}
