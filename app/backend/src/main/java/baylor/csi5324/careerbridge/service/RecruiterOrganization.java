package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.MembershipStatus;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.OrganizationMembership;
import baylor.csi5324.careerbridge.repository.OrganizationMembershipRepository;
import baylor.csi5324.careerbridge.repository.RecruiterRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

// The organizations a recruiter acts for are their Active OrganizationMemberships (BR-14, A16, UC-09).
// A recruiter works in one at a time, chosen in the header (UC-09 special requirements); until that
// switcher exists, one with several works in the organization named here, or else the earliest joined.
@Component
public class RecruiterOrganization {

    private final RecruiterRepository recruiterRepository;
    private final OrganizationMembershipRepository membershipRepository;
    private final String preferredName;

    public RecruiterOrganization(RecruiterRepository recruiterRepository,
                                 OrganizationMembershipRepository membershipRepository,
                                 @Value("${careerbridge.recruiter-organization:}") String preferredName) {
        this.recruiterRepository = recruiterRepository;
        this.membershipRepository = membershipRepository;
        this.preferredName = preferredName.trim();
    }

    // The organization the recruiter works in now: empty when they have no Active membership
    public Optional<Organization> activeOrganizationOf(String recruiterEmail) {
        List<Organization> organizations = activeOrganizations(recruiterEmail);
        return organizations.stream()
                .filter(organization -> organization.getName().equals(preferredName))
                .findFirst()
                .or(() -> organizations.stream().findFirst());
    }

    public boolean isActiveMember(String recruiterEmail, Organization organization) {
        return activeOrganizations(recruiterEmail).stream()
                .anyMatch(member -> member.getOrganizationId().equals(organization.getOrganizationId()));
    }

    private List<Organization> activeOrganizations(String recruiterEmail) {
        // FR-ADM.2: a deactivated recruiter acts for no organization, even in a session opened before
        return recruiterRepository.findByEmailIgnoreCase(recruiterEmail)
                .filter(recruiter -> recruiter.getAccountStatus() == AccountStatus.ACTIVE)
                .map(recruiter -> membershipRepository.findByRecruiterOrderByRequestedAtAscMembershipIdAsc(recruiter)
                        .stream()
                        .filter(membership -> membership.getStatus() == MembershipStatus.ACTIVE)
                        .map(OrganizationMembership::getOrganization)
                        .toList())
                .orElse(List.of());
    }
}
