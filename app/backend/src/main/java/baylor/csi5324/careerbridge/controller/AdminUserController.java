package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.controller.dto.UsersResponse;
import baylor.csi5324.careerbridge.service.AccountChangeRefusedException;
import baylor.csi5324.careerbridge.service.UserDirectoryService;
import baylor.csi5324.careerbridge.service.UserNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
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

    @PostMapping("/{userId}/deactivate")
    public UsersResponse.UserRow deactivateRecruiter(@PathVariable Long userId) {
        return UsersResponse.UserRow.from(userDirectoryService.deactivateRecruiter(userId), true);
    }

    @PostMapping("/{userId}/reactivate")
    public UsersResponse.UserRow reactivateRecruiter(@PathVariable Long userId) {
        return UsersResponse.UserRow.from(userDirectoryService.reactivateRecruiter(userId), false);
    }

    @ExceptionHandler(AccountChangeRefusedException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public String handleRefused(AccountChangeRefusedException ex) {
        return ex.getMessage();
    }

    @ExceptionHandler(UserNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public String handleNotFound(UserNotFoundException ex) {
        return ex.getMessage();
    }
}
