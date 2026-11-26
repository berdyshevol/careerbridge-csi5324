package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.Role;
import baylor.csi5324.careerbridge.model.User;

import java.util.List;
import java.util.Map;
import java.util.Set;

// Every user, by role and then name, and how many users each role has (FR-ADM.1). Deactivated recruiters
// are told apart from denied ones, which share the Inactive status, so only they are offered Reactivate (FR-ADM.2)
public record UserDirectory(List<User> users, Map<Role, Long> usersByRole, Set<Long> deactivatedRecruiters) {
}
