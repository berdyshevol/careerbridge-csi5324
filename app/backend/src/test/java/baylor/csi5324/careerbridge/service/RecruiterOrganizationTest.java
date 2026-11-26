package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.MembershipRequestType;
import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.MembershipStatus;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.OrganizationMembership;
import baylor.csi5324.careerbridge.model.Recruiter;
import baylor.csi5324.careerbridge.repository.OrganizationMembershipRepository;
import baylor.csi5324.careerbridge.repository.RecruiterRepository;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RecruiterOrganizationTest {

    private final RecruiterRepository recruiters = mock(RecruiterRepository.class);
    private final OrganizationMembershipRepository memberships = mock(OrganizationMembershipRepository.class);
    private final Recruiter riley = new Recruiter();
    private final Organization brazos = organization(1L, "Brazos Analytics");
    private final Organization waco = organization(2L, "Waco Health Partners");
    private final Organization logistics = organization(3L, "Lone Star Logistics");

    RecruiterOrganizationTest() {
        riley.setAccountStatus(AccountStatus.ACTIVE);
        when(recruiters.findByEmailIgnoreCase("riley@example.com")).thenReturn(Optional.of(riley));
        when(memberships.findByRecruiterOrderByRequestedAtAscMembershipIdAsc(riley)).thenReturn(List.of(
                membership(brazos, MembershipStatus.ACTIVE),
                membership(waco, MembershipStatus.ACTIVE),
                membership(logistics, MembershipStatus.PENDING)));
    }

    @Test
    void aRecruiterWorksInTheNamedOrganizationWhenTheyAreAMemberOfIt() {
        assertThat(lookup("Waco Health Partners").activeOrganizationOf("riley@example.com")).contains(waco);
    }

    @Test
    void otherwiseInTheOrganizationTheyJoinedFirst() {
        assertThat(lookup("").activeOrganizationOf("riley@example.com")).contains(brazos);
        assertThat(lookup("Lone Star Logistics").activeOrganizationOf("riley@example.com")).contains(brazos);
    }

    @Test
    void onlyAnActiveMembershipCounts() {
        RecruiterOrganization lookup = lookup("");

        assertThat(lookup.isActiveMember("riley@example.com", waco)).isTrue();
        assertThat(lookup.isActiveMember("riley@example.com", logistics)).isFalse();
        assertThat(lookup.isActiveMember("nobody@example.com", waco)).isFalse();
        assertThat(lookup.activeOrganizationOf("nobody@example.com")).isEmpty();
    }

    @Test
    void aDeactivatedRecruiterActsForNoOrganization() {
        riley.setAccountStatus(AccountStatus.INACTIVE);
        RecruiterOrganization lookup = lookup("");

        assertThat(lookup.activeOrganizationOf("riley@example.com")).isEmpty();
        assertThat(lookup.isActiveMember("riley@example.com", brazos)).isFalse();
    }

    private RecruiterOrganization lookup(String preferred) {
        return new RecruiterOrganization(recruiters, memberships, preferred);
    }

    private OrganizationMembership membership(Organization organization, MembershipStatus status) {
        return new OrganizationMembership(riley, organization, status,
                MembershipRequestType.NEW_RECRUITER_EXISTING_ORGANIZATION, Instant.now());
    }

    private static Organization organization(Long id, String name) {
        Organization organization = new Organization(name);
        organization.setOrganizationId(id);
        return organization;
    }
}
