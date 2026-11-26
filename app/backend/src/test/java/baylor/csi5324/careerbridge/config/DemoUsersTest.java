package baylor.csi5324.careerbridge.config;

import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.OrganizationStatus;
import baylor.csi5324.careerbridge.model.User;
import baylor.csi5324.careerbridge.repository.OrganizationMembershipRepository;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import baylor.csi5324.careerbridge.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DemoUsersTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    private final OrganizationRepository organizationRepository = mock(OrganizationRepository.class);

    private DemoUsers demoUsersOn(String databaseUrl) {
        when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(call -> call.getArgument(0));
        when(organizationRepository.save(any(Organization.class))).thenAnswer(call -> call.getArgument(0));
        return new DemoUsers(userRepository, organizationRepository,
                mock(OrganizationMembershipRepository.class), passwordEncoder, "", "", "", databaseUrl, true);
    }

    @Test
    void withoutPasswordsAStoredDatabaseGetsNoDemoAccounts() {
        demoUsersOn("jdbc:postgresql://example.neon.tech/neondb").run();

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void anInMemoryDatabaseGetsTheNumberedAccountsWithTheLocalPassword() {
        demoUsersOn("jdbc:h2:mem:careerbridge").run();

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository, atLeastOnce()).save(saved.capture());
        assertThat(saved.getAllValues()).extracting(User::getEmail).contains(
                "applicant1@example.com", "applicant2@example.com", "applicant3@example.com",
                "recruiter1@example.com", "recruiter2@example.com", "recruiter3@example.com",
                "recruiter4@example.com", "recruiter5@example.com", "recruiter6@example.com");
        verify(passwordEncoder, atLeastOnce()).encode("Baylor@2026");
    }

    @Test
    void anInMemoryDatabaseGivesEveryDemoAccountTheSamePassword() {
        when(passwordEncoder.encode(anyString())).thenReturn("hash");

        demoUsersOn("jdbc:h2:mem:careerbridge").run();

        verify(passwordEncoder, atLeastOnce()).encode("Baylor@2026");
        verify(passwordEncoder, never()).encode(argThat(password -> !"Baylor@2026".equals(password)));
    }

    // The live database never loads data/jobs.csv, where these organizations come from (SCRUM-228)
    @Test
    void createsTheOwnOrganizationOfANumberedRecruiterWhenItIsMissing() {
        demoUsersOn("jdbc:h2:mem:careerbridge").run();

        ArgumentCaptor<Organization> saved = ArgumentCaptor.forClass(Organization.class);
        verify(organizationRepository, atLeastOnce()).save(saved.capture());
        assertThat(saved.getAllValues()).extracting(Organization::getName).containsExactlyInAnyOrder(
                "Pixel Labs", "Lone Star Robotics", "Cloud Nine Software", "Green Grid Energy");
        assertThat(saved.getAllValues()).extracting(Organization::getOrganizationStatus)
                .containsOnly(OrganizationStatus.ACTIVE);
    }
}
