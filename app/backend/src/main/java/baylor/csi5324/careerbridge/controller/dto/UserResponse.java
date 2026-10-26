package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.model.Role;
import baylor.csi5324.careerbridge.model.User;

// Never the password hash or the log-in counters
public record UserResponse(Long userId, String firstName, String lastName, String email, String phone, Role role) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getUserId(), user.getFirstName(), user.getLastName(),
                user.getEmail(), user.getPhone(), Role.of(user));
    }
}
