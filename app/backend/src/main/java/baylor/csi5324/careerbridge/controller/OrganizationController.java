package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.controller.dto.OrganizationResponse;
import baylor.csi5324.careerbridge.service.MembershipService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// UC-09 steps 2-3: a read of the registered organizations, which changes nothing and needs no role
@RestController
@RequestMapping("/api/organizations")
public class OrganizationController {

    private final MembershipService membershipService;

    public OrganizationController(MembershipService membershipService) {
        this.membershipService = membershipService;
    }

    @GetMapping
    public List<OrganizationResponse> searchOrganizations(@RequestParam(required = false) String query) {
        return membershipService.searchOrganizations(query).stream().map(OrganizationResponse::from).toList();
    }
}
