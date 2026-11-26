package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.service.PasswordResetLinkException;
import baylor.csi5324.careerbridge.service.PasswordResetService;
import baylor.csi5324.careerbridge.service.RegistrationRefusedException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth/password-reset")
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    public PasswordResetController(PasswordResetService passwordResetService) {
        this.passwordResetService = passwordResetService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    public Map<String, String> requestPasswordReset(@RequestBody EmailRequest request) {
        Map<String, String> answer = new HashMap<>();
        passwordResetService.requestPasswordReset(request.email()).ifPresent(link -> answer.put("resetLink", link));
        return answer;
    }

    @PostMapping("/new-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@RequestBody NewPasswordRequest request) {
        passwordResetService.resetPassword(request.token(), request.password());
    }

    @ExceptionHandler(RegistrationRefusedException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleRefused(RegistrationRefusedException ex) {
        return ex.getFieldErrors();
    }

    @ExceptionHandler(PasswordResetLinkException.class)
    public ResponseEntity<Map<String, Object>> handleLink(PasswordResetLinkException ex) {
        return ResponseEntity.status(ex.isExpired() ? HttpStatus.GONE : HttpStatus.NOT_FOUND)
                .body(Map.of("expired", ex.isExpired(), "message", ex.getMessage()));
    }

    public record EmailRequest(String email) {
    }

    public record NewPasswordRequest(String token, String password) {
    }
}
