package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.Recruiter;
import baylor.csi5324.careerbridge.model.Role;
import baylor.csi5324.careerbridge.service.AccountChangeRefusedException;
import baylor.csi5324.careerbridge.service.UserDirectory;
import baylor.csi5324.careerbridge.service.UserDirectoryService;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminUserControllerTest {

    private final UserDirectoryService userDirectoryService = mock(UserDirectoryService.class);
    private final MockMvc mockMvc =
            MockMvcBuilders.standaloneSetup(new AdminUserController(userDirectoryService)).build();

    @Test
    void sendsEachUsersNameEmailRoleAndStatusButNeverThePassword() throws Exception {
        Recruiter riley = new Recruiter();
        riley.setUserId(1L);
        riley.setFirstName("Riley");
        riley.setLastName("Chen");
        riley.setEmail("riley.chen@example.com");
        riley.setAccountStatus(AccountStatus.ACTIVE);
        riley.setPasswordHash("secret-hash");
        when(userDirectoryService.viewUsers()).thenReturn(new UserDirectory(List.of(riley),
                Map.of(Role.APPLICANT, 0L, Role.RECRUITER, 1L, Role.ADMINISTRATOR, 0L), Set.of()));

        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users[0].firstName").value("Riley"))
                .andExpect(jsonPath("$.users[0].email").value("riley.chen@example.com"))
                .andExpect(jsonPath("$.users[0].role").value("RECRUITER"))
                .andExpect(jsonPath("$.users[0].accountStatus").value("ACTIVE"))
                .andExpect(jsonPath("$.usersByRole.RECRUITER").value(1))
                .andExpect(content().string(not(containsString("secret-hash"))))
                .andExpect(content().string(not(containsString("password"))));
    }

    @Test
    void deactivatingAnswersWithTheNewStatusAndRefusesWithTheReason() throws Exception {
        Recruiter riley = new Recruiter();
        riley.setEmail("riley.chen@example.com");
        riley.setAccountStatus(AccountStatus.INACTIVE);
        when(userDirectoryService.deactivateRecruiter(7L)).thenReturn(riley);
        when(userDirectoryService.reactivateRecruiter(8L))
                .thenThrow(new AccountChangeRefusedException("Only a deactivated recruiter can be reactivated."));

        mockMvc.perform(post("/api/admin/users/7/deactivate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountStatus").value("INACTIVE"))
                .andExpect(jsonPath("$.deactivated").value(true));
        mockMvc.perform(post("/api/admin/users/8/reactivate"))
                .andExpect(status().isConflict())
                .andExpect(content().string("Only a deactivated recruiter can be reactivated."));
    }
}
