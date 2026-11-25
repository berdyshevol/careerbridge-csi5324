package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.Role;
import baylor.csi5324.careerbridge.model.User;

import java.util.List;
import java.util.Map;

// Every user, by role and then name, and how many users each role has (FR-ADM.1)
public record UserDirectory(List<User> users, Map<Role, Long> usersByRole) {
}
