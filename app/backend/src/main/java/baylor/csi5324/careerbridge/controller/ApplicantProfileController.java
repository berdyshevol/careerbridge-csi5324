package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.controller.dto.ProfileResponse;
import baylor.csi5324.careerbridge.service.ApplicantProfileService;
import baylor.csi5324.careerbridge.service.ProfileDetails;
import baylor.csi5324.careerbridge.service.ProfileRefusedException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/applicant/profile")
public class ApplicantProfileController {

    private final ApplicantProfileService applicantProfileService;

    public ApplicantProfileController(ApplicantProfileService applicantProfileService) {
        this.applicantProfileService = applicantProfileService;
    }

    @GetMapping
    public ProfileResponse viewProfile(Principal applicant) {
        return ProfileResponse.from(applicantProfileService.viewProfile(applicant.getName()));
    }

    @PutMapping
    public ProfileResponse updateProfile(Principal applicant, @RequestBody ProfileDetails details) {
        return ProfileResponse.from(applicantProfileService.updateProfile(applicant.getName(), details));
    }

    // Field by field, so the form can put each reason next to its field (UC-03 extension 4a)
    @ExceptionHandler(ProfileRefusedException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleRefused(ProfileRefusedException ex) {
        return ex.getFieldErrors();
    }
}
