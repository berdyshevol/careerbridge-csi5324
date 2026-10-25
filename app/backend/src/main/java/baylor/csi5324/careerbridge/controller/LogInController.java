package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.controller.dto.LogInRequest;
import baylor.csi5324.careerbridge.controller.dto.LoggedInResponse;
import baylor.csi5324.careerbridge.controller.dto.UserResponse;
import baylor.csi5324.careerbridge.service.LogInRefusedException;
import baylor.csi5324.careerbridge.service.LogInService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class LogInController {

    private final LogInService logInService;

    public LogInController(LogInService logInService) {
        this.logInService = logInService;
    }

    @PostMapping("/login")
    public LoggedInResponse logIn(@RequestBody LogInRequest request) {
        return LoggedInResponse.from(logInService.logIn(request.email(), request.password()));
    }

    @GetMapping("/me")
    public UserResponse currentUser(Authentication authentication) {
        return UserResponse.from(logInService.currentUser(authentication.getName()));
    }

    @ExceptionHandler(LogInRefusedException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public String handleRefused(LogInRefusedException ex) {
        return ex.getMessage();
    }
}
