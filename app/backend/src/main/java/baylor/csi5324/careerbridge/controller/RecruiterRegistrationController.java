package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.controller.dto.RecruiterRegistrationRequest;
import baylor.csi5324.careerbridge.controller.dto.RecruiterRegistrationResponse;
import baylor.csi5324.careerbridge.model.Recruiter;
import baylor.csi5324.careerbridge.service.RecruiterRegistrationService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

// UC-08, for a visitor: no log-in (anyRequest().permitAll() in SecurityConfig)
@RestController
@RequestMapping("/api/recruiters")
public class RecruiterRegistrationController {

    private final RecruiterRegistrationService registrationService;

    public RecruiterRegistrationController(RecruiterRegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RecruiterRegistrationResponse submitRecruiterRegistration(@RequestBody RecruiterRegistrationRequest request) {
        return RecruiterRegistrationResponse.from(registrationService.submitRecruiterRegistration(
                request.recruiter(), request.organization(), request.joinOrganizationId()));
    }

    // A POST, not the link's own GET: the link opens a frontend page, and a read changes nothing (ADR-0010)
    @PostMapping("/verification")
    public Map<String, String> verifyRecruiterEmail(@RequestBody TokenRequest request) {
        Recruiter recruiter = registrationService.verifyRecruiterEmail(request.token());
        return Map.of("email", recruiter.getEmail());
    }

    @PostMapping("/verification/new")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public Map<String, String> requestNewVerificationLink(@RequestBody TokenRequest request) {
        Map<String, String> answer = new HashMap<>();
        registrationService.requestNewVerificationLink(request.token())
                .ifPresent(link -> answer.put("verificationLink", link));
        return answer;
    }

    public record TokenRequest(String token) {
    }
}
