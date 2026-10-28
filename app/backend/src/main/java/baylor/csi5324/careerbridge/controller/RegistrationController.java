package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.controller.dto.LoggedInResponse;
import baylor.csi5324.careerbridge.controller.dto.RegisterRequest;
import baylor.csi5324.careerbridge.service.AlreadyRegisteredException;
import baylor.csi5324.careerbridge.service.RegistrationRefusedException;
import baylor.csi5324.careerbridge.service.RegistrationService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/applicants")
public class RegistrationController {

    private final RegistrationService registrationService;

    public RegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LoggedInResponse register(@RequestBody RegisterRequest request) {
        return LoggedInResponse.from(
                registrationService.register(request.fullName(), request.email(), request.password()));
    }

    // Field by field, so the form can put each reason next to its field (UC-02 extension 2a)
    @ExceptionHandler(RegistrationRefusedException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleRefused(RegistrationRefusedException ex) {
        return ex.getFieldErrors();
    }

    @ExceptionHandler(AlreadyRegisteredException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public String handleAlreadyRegistered(AlreadyRegisteredException ex) {
        return ex.getMessage();
    }
}
