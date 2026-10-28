package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.controller.dto.ProfileResponse;
import baylor.csi5324.careerbridge.controller.dto.ResumeResponse;
import baylor.csi5324.careerbridge.service.ApplicantProfileService;
import baylor.csi5324.careerbridge.service.ProfileDetails;
import baylor.csi5324.careerbridge.service.ProfileRefusedException;
import baylor.csi5324.careerbridge.service.ResumeRefusedException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/applicant")
public class ApplicantProfileController {

    private final ApplicantProfileService applicantProfileService;

    public ApplicantProfileController(ApplicantProfileService applicantProfileService) {
        this.applicantProfileService = applicantProfileService;
    }

    @GetMapping("/profile")
    public ProfileResponse viewProfile(Principal applicant) {
        return ProfileResponse.from(applicantProfileService.viewProfile(applicant.getName()));
    }

    @PutMapping("/profile")
    public ProfileResponse updateProfile(Principal applicant, @RequestBody ProfileDetails details) {
        return ProfileResponse.from(applicantProfileService.updateProfile(applicant.getName(), details));
    }

    @PostMapping("/resume")
    @ResponseStatus(HttpStatus.CREATED)
    public ResumeResponse uploadResume(Principal applicant, @RequestParam("file") MultipartFile file) {
        return ResumeResponse.from(applicantProfileService.uploadResume(applicant.getName(), file));
    }

    // Field by field, so the form can put each reason next to its field (UC-03 extension 4a)
    @ExceptionHandler(ProfileRefusedException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleRefused(ProfileRefusedException ex) {
        return ex.getFieldErrors();
    }

    // In plain text, as the reason is for the applicant (UC-03 extension 6a)
    @ExceptionHandler(ResumeRefusedException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public String handleRefused(ResumeRefusedException ex) {
        return ex.getMessage();
    }

    // A file over the multipart limit never reaches the service (application.properties)
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public String handleTooLarge() {
        return ApplicantProfileService.RESUME_TOO_LARGE;
    }
}
