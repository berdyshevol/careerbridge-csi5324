package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.controller.dto.ProfileResponse;
import baylor.csi5324.careerbridge.service.ApplicantProfileService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

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
}
