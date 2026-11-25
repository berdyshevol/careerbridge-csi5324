package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.OrganizationMembership;

import java.util.List;

// UC-10 step 4. duplicateOf is the registered organization a new one duplicates (extension 5c), or null.
public record MembershipRequestDetails(OrganizationMembership request,
                                       List<OrganizationMembership> otherMemberships,
                                       Organization duplicateOf) {
}
