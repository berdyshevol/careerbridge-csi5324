package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.MembershipStatus;
import baylor.csi5324.careerbridge.model.Recruiter;
import baylor.csi5324.careerbridge.model.Role;
import baylor.csi5324.careerbridge.model.User;
import baylor.csi5324.careerbridge.repository.OrganizationMembershipRepository;
import baylor.csi5324.careerbridge.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

// Minimum scope Administrator 2 (viewUsers, a query) and 3 (CO-ADM.1 and CO-ADM.2, managing recruiter accounts)
@Service
public class UserDirectoryService {

    // Administrators first, as the admin-users mockup draws them
    private static final List<Role> ROLE_ORDER = List.of(Role.ADMINISTRATOR, Role.RECRUITER, Role.APPLICANT);

    private static final Comparator<User> BY_ROLE_THEN_NAME = Comparator
            .comparing((User user) -> ROLE_ORDER.indexOf(Role.of(user)))
            .thenComparing(User::getLastName, String.CASE_INSENSITIVE_ORDER)
            .thenComparing(User::getFirstName, String.CASE_INSENSITIVE_ORDER)
            .thenComparing(User::getUserId);

    private final UserRepository userRepository;
    private final OrganizationMembershipRepository membershipRepository;

    public UserDirectoryService(UserRepository userRepository, OrganizationMembershipRepository membershipRepository) {
        this.userRepository = userRepository;
        this.membershipRepository = membershipRepository;
    }

    @Transactional(readOnly = true)
    public UserDirectory viewUsers() {
        List<User> users = userRepository.findAll().stream().sorted(BY_ROLE_THEN_NAME).toList();
        Map<Role, Long> usersByRole = new EnumMap<>(Role.class);
        for (Role role : Role.values()) {
            usersByRole.put(role, 0L);
        }
        users.forEach(user -> usersByRole.merge(Role.of(user), 1L, Long::sum));
        Set<Long> deactivated = users.stream()
                .filter(user -> user instanceof Recruiter recruiter && isDeactivated(recruiter))
                .map(User::getUserId)
                .collect(Collectors.toSet());
        return new UserDirectory(users, usersByRole, deactivated);
    }

    // CO-ADM.1. Memberships and postings stay, so a reactivated recruiter carries on where they left off
    @Transactional
    public User deactivateRecruiter(Long userId) {
        Recruiter recruiter = recruiter(userId);
        if (recruiter.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new AccountChangeRefusedException(
                    "Only an active recruiter can be deactivated. A pending request is decided under Recruiter requests.");
        }
        recruiter.setAccountStatus(AccountStatus.INACTIVE);
        return recruiter;
    }

    // CO-ADM.2. An inactive recruiter with no Active membership was denied (UC-10), which this does not reopen
    @Transactional
    public User reactivateRecruiter(Long userId) {
        Recruiter recruiter = recruiter(userId);
        if (!isDeactivated(recruiter)) {
            throw new AccountChangeRefusedException("Only a deactivated recruiter can be reactivated.");
        }
        recruiter.setAccountStatus(AccountStatus.ACTIVE);
        return recruiter;
    }

    private Recruiter recruiter(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(UserNotFoundException::new);
        if (!(user instanceof Recruiter recruiter)) {
            throw new AccountChangeRefusedException("Only recruiter accounts are managed here.");
        }
        return recruiter;
    }

    public boolean isDeactivated(Recruiter recruiter) {
        return recruiter.getAccountStatus() == AccountStatus.INACTIVE
                && membershipRepository.findByRecruiterOrderByRequestedAtAscMembershipIdAsc(recruiter).stream()
                        .anyMatch(membership -> membership.getStatus() == MembershipStatus.ACTIVE);
    }
}
