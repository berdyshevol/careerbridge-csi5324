package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RecruiterOrganizationTest {

    private final OrganizationRepository organizations = mock(OrganizationRepository.class);
    private final Organization waco = organization("Waco Health Partners");
    private final Organization brazos = organization("Brazos Analytics");

    RecruiterOrganizationTest() {
        when(organizations.findByName("Waco Health Partners")).thenReturn(Optional.of(waco));
        when(organizations.findByName("Brazos Analytics")).thenReturn(Optional.of(brazos));
    }

    @Test
    void everyRecruiterActsForTheConfiguredOrganization() {
        RecruiterOrganization standIn = new RecruiterOrganization(organizations, "Waco Health Partners", "");

        assertThat(standIn.activeOrganizationOf("riley.chen@example.com")).contains(waco);
    }

    @Test
    void aRecruiterNamedInTheExceptionsActsForTheirOwnOrganization() {
        RecruiterOrganization standIn = new RecruiterOrganization(organizations, "Waco Health Partners",
                "Recruiter2@Example.com = Brazos Analytics; nobody");

        assertThat(standIn.activeOrganizationOf("recruiter2@example.com")).contains(brazos);
        assertThat(standIn.activeOrganizationOf("riley.chen@example.com")).contains(waco);
    }

    @Test
    void withNoOrganizationSetARecruiterActsForNone() {
        RecruiterOrganization standIn = new RecruiterOrganization(organizations, "", "");

        assertThat(standIn.activeOrganizationOf("riley.chen@example.com")).isEmpty();
    }

    private static Organization organization(String name) {
        Organization organization = new Organization();
        organization.setName(name);
        return organization;
    }
}
