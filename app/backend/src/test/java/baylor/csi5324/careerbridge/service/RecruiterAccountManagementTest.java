package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.MembershipRequestType;
import baylor.csi5324.careerbridge.model.MembershipStatus;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.OrganizationMembership;
import baylor.csi5324.careerbridge.model.Recruiter;
import baylor.csi5324.careerbridge.repository.OrganizationMembershipRepository;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import baylor.csi5324.careerbridge.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// FR-ADM.2, CO-ADM.1 and CO-ADM.2. Each test makes its own recruiter, and the transaction rolls it back
@SpringBootTest
@Transactional
class RecruiterAccountManagementTest {

    private static final String PASSWORD = "Recruiter-pass-1";

    @Autowired
    private UserDirectoryService userDirectoryService;
    @Autowired
    private LogInService logInService;
    @Autowired
    private RecruiterOrganization recruiterOrganization;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private OrganizationRepository organizationRepository;
    @Autowired
    private OrganizationMembershipRepository membershipRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    private Recruiter recruiter(AccountStatus status, MembershipStatus membershipStatus) {
        Recruiter recruiter = new Recruiter();
        recruiter.setFirstName("Robin");
        recruiter.setLastName("Hale");
        recruiter.setEmail("robin.hale." + System.nanoTime() + "@example.com");
        recruiter.setAccountStatus(status);
        recruiter.setEmailVerified(true);
        recruiter.setPasswordHash(passwordEncoder.encode(PASSWORD));
        userRepository.save(recruiter);
        Organization organization = organizationRepository.findByName("Brazos Analytics").orElseThrow();
        membershipRepository.save(new OrganizationMembership(recruiter, organization, membershipStatus,
                MembershipRequestType.NEW_RECRUITER_EXISTING_ORGANIZATION, Instant.now()));
        return recruiter;
    }

    @Test
    void aDeactivatedRecruiterCannotLogInOrActForTheirOrganization() {
        Recruiter recruiter = recruiter(AccountStatus.ACTIVE, MembershipStatus.ACTIVE);
        assertThat(recruiterOrganization.activeOrganizationOf(recruiter.getEmail())).isPresent();

        userDirectoryService.deactivateRecruiter(recruiter.getUserId());

        assertThat(recruiter.getAccountStatus()).isEqualTo(AccountStatus.INACTIVE);
        assertThatThrownBy(() -> logInService.logIn(recruiter.getEmail(), PASSWORD))
                .isInstanceOf(LogInRefusedException.class)
                .hasMessage("This account was deactivated by the administrator. Contact them to have it reactivated.");
        assertThat(recruiterOrganization.activeOrganizationOf(recruiter.getEmail())).isEmpty();
        assertThat(userDirectoryService.viewUsers().deactivatedRecruiters()).contains(recruiter.getUserId());
    }

    @Test
    void aReactivatedRecruiterLogsInAgain() {
        Recruiter recruiter = recruiter(AccountStatus.ACTIVE, MembershipStatus.ACTIVE);
        userDirectoryService.deactivateRecruiter(recruiter.getUserId());

        userDirectoryService.reactivateRecruiter(recruiter.getUserId());

        assertThat(logInService.logIn(recruiter.getEmail(), PASSWORD).user().getEmail()).isEqualTo(recruiter.getEmail());
        assertThat(recruiterOrganization.activeOrganizationOf(recruiter.getEmail())).isPresent();
    }

    @Test
    void aPendingRecruiterIsDecidedUnderRecruiterRequestsInstead() {
        Recruiter pending = recruiter(AccountStatus.PENDING_APPROVAL, MembershipStatus.PENDING);

        assertThatThrownBy(() -> userDirectoryService.deactivateRecruiter(pending.getUserId()))
                .isInstanceOf(AccountChangeRefusedException.class);
        assertThat(pending.getAccountStatus()).isEqualTo(AccountStatus.PENDING_APPROVAL);
    }

    @Test
    void aDeniedRecruiterIsNotReopenedByReactivate() {
        Recruiter denied = recruiter(AccountStatus.INACTIVE, MembershipStatus.DENIED);

        assertThatThrownBy(() -> userDirectoryService.reactivateRecruiter(denied.getUserId()))
                .isInstanceOf(AccountChangeRefusedException.class);
        assertThat(denied.getAccountStatus()).isEqualTo(AccountStatus.INACTIVE);
    }

    @Test
    void onlyRecruiterAccountsAreManagedHere() {
        Applicant applicant = new Applicant();
        applicant.setFirstName("Pat");
        applicant.setLastName("Kim");
        applicant.setEmail("pat.kim." + System.nanoTime() + "@example.com");
        applicant.setAccountStatus(AccountStatus.ACTIVE);
        userRepository.save(applicant);

        assertThatThrownBy(() -> userDirectoryService.deactivateRecruiter(applicant.getUserId()))
                .isInstanceOf(AccountChangeRefusedException.class);
        assertThatThrownBy(() -> userDirectoryService.deactivateRecruiter(-1L))
                .isInstanceOf(UserNotFoundException.class);
    }
}
