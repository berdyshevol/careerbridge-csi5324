package baylor.csi5324.careerbridge.config;

import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.MembershipStatus;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.OrganizationMembership;
import baylor.csi5324.careerbridge.model.OrganizationStatus;
import baylor.csi5324.careerbridge.model.Recruiter;
import baylor.csi5324.careerbridge.model.User;
import baylor.csi5324.careerbridge.repository.OrganizationMembershipRepository;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import baylor.csi5324.careerbridge.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DemoRecruiterRequestsTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final OrganizationRepository organizationRepository = mock(OrganizationRepository.class);
    private final OrganizationMembershipRepository membershipRepository = mock(OrganizationMembershipRepository.class);
    private final Organization pixelLabs = new Organization("Pixel Labs");

    private DemoRecruiterRequests requests(boolean enabled) {
        when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(organizationRepository.findByName(anyString())).thenReturn(Optional.empty());
        when(organizationRepository.findByName("Pixel Labs")).thenReturn(Optional.of(pixelLabs));
        when(organizationRepository.save(any(Organization.class))).thenAnswer(call -> call.getArgument(0));
        return new DemoRecruiterRequests(userRepository, organizationRepository, membershipRepository,
                Clock.fixed(Instant.parse("2026-11-25T18:00:00Z"), ZoneOffset.UTC), enabled);
    }

    @Test
    void putsTwoRequestsInTheAdministratorsQueue() {
        requests(true).run();

        ArgumentCaptor<OrganizationMembership> saved = ArgumentCaptor.forClass(OrganizationMembership.class);
        verify(membershipRepository, times(2)).save(saved.capture());
        assertThat(saved.getAllValues()).extracting(OrganizationMembership::getStatus)
                .containsOnly(MembershipStatus.PENDING);
        assertThat(saved.getAllValues()).extracting(membership -> membership.getOrganization().getName())
                .containsExactly("Bright Path Tutoring", "Pixel Labs");
        assertThat(saved.getAllValues().get(0).getOrganization().getOrganizationStatus())
                .isEqualTo(OrganizationStatus.PENDING_APPROVAL);
        assertThat(saved.getAllValues()).extracting(membership -> membership.getRecruiter().getAccountStatus())
                .containsOnly(AccountStatus.PENDING_APPROVAL);
    }

    @Test
    void leavesARequestWhoseEmailIsAlreadyUsed() {
        DemoRecruiterRequests demo = requests(true);
        when(userRepository.findByEmailIgnoreCase("taylor.brooks@example.com"))
                .thenReturn(Optional.of((User) new Recruiter()));

        demo.run();

        verify(membershipRepository, times(1)).save(any(OrganizationMembership.class));
    }

    @Test
    void addsNothingWhenSwitchedOff() {
        requests(false).run();

        verify(membershipRepository, never()).save(any(OrganizationMembership.class));
    }
}
