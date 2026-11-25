package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.Role;
import baylor.csi5324.careerbridge.model.User;
import baylor.csi5324.careerbridge.service.UserDirectory;

import java.util.List;
import java.util.Map;

// NFR-ADM.1: never the password hash or the log-in counters
public record UsersResponse(List<UserRow> users, Map<Role, Long> usersByRole) {

    public record UserRow(Long userId, String firstName, String lastName, String email, Role role,
                          AccountStatus accountStatus) {

        static UserRow from(User user) {
            return new UserRow(user.getUserId(), user.getFirstName(), user.getLastName(), user.getEmail(),
                    Role.of(user), user.getAccountStatus());
        }
    }

    public static UsersResponse from(UserDirectory directory) {
        return new UsersResponse(directory.users().stream().map(UserRow::from).toList(), directory.usersByRole());
    }
}
