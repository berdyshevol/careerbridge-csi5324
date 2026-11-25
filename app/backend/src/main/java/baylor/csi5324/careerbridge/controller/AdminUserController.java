package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.controller.dto.UsersResponse;
import baylor.csi5324.careerbridge.service.UserDirectoryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Only the Administrator reaches /api/admin/** (SecurityConfig)
@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final UserDirectoryService userDirectoryService;

    public AdminUserController(UserDirectoryService userDirectoryService) {
        this.userDirectoryService = userDirectoryService;
    }

    @GetMapping
    public UsersResponse viewUsers() {
        return UsersResponse.from(userDirectoryService.viewUsers());
    }
}
