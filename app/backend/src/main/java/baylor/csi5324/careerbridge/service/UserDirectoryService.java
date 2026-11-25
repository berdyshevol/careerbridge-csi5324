package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.Role;
import baylor.csi5324.careerbridge.model.User;
import baylor.csi5324.careerbridge.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

// Minimum scope Administrator 2: a query, so it has no operation contract
@Service
public class UserDirectoryService {

    private static final Comparator<User> BY_ROLE_THEN_NAME = Comparator
            .comparing(Role::of)
            .thenComparing(User::getLastName, String.CASE_INSENSITIVE_ORDER)
            .thenComparing(User::getFirstName, String.CASE_INSENSITIVE_ORDER)
            .thenComparing(User::getUserId);

    private final UserRepository userRepository;

    public UserDirectoryService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserDirectory viewUsers() {
        List<User> users = userRepository.findAll().stream().sorted(BY_ROLE_THEN_NAME).toList();
        Map<Role, Long> usersByRole = new EnumMap<>(Role.class);
        for (Role role : Role.values()) {
            usersByRole.put(role, 0L);
        }
        users.forEach(user -> usersByRole.merge(Role.of(user), 1L, Long::sum));
        return new UserDirectory(users, usersByRole);
    }
}
