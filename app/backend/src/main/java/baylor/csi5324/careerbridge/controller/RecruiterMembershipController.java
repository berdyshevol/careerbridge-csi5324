package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.controller.dto.MembershipRequestBody;
import baylor.csi5324.careerbridge.controller.dto.MembershipResponse;
import baylor.csi5324.careerbridge.model.OrganizationMembership;
import baylor.csi5324.careerbridge.service.MembershipService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// UC-09, for the logged-in Recruiter (/api/recruiter/** in SecurityConfig)
@RestController
@RequestMapping("/api/recruiter/memberships")
public class RecruiterMembershipController {

    private final MembershipService membershipService;

    public RecruiterMembershipController(MembershipService membershipService) {
        this.membershipService = membershipService;
    }

    @GetMapping
    public List<MembershipResponse> viewMemberships(Authentication recruiter) {
        return membershipService.viewMemberships(recruiter.getName()).stream().map(MembershipResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MembershipResponse submitMembershipRequest(@RequestBody MembershipRequestBody request,
                                                      Authentication recruiter) {
        OrganizationMembership created = request.organization() != null && request.organizationId() == null
                ? membershipService.submitMembershipRequest(recruiter.getName(), request.organization(),
                request.role(), request.justification())
                : membershipService.submitMembershipRequest(recruiter.getName(), request.organizationId(),
                request.role(), request.justification());
        return MembershipResponse.from(created);
    }

    @PostMapping("/{membershipId}/cancel")
    public MembershipResponse cancelMembershipRequest(@PathVariable Long membershipId, Authentication recruiter) {
        return MembershipResponse.from(membershipService.cancelMembershipRequest(recruiter.getName(), membershipId));
    }
}
