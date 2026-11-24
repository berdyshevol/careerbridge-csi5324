package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.controller.dto.ApplicantApplicationsResponse;
import baylor.csi5324.careerbridge.controller.dto.ApplicationDetailResponse;
import baylor.csi5324.careerbridge.service.ApplicationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

// CO-05.1 and CO-05.2
@RestController
@RequestMapping("/api/applicant/applications")
public class ApplicantApplicationsController {

    private final ApplicationService applicationService;

    public ApplicantApplicationsController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @GetMapping
    public ApplicantApplicationsResponse viewApplications(Principal applicant) {
        return ApplicantApplicationsResponse.from(applicationService.viewApplications(applicant.getName()));
    }

    @GetMapping("/{applicationId}")
    public ApplicationDetailResponse viewApplication(@PathVariable Long applicationId, Principal applicant) {
        return ApplicationDetailResponse.from(applicationService.viewApplication(applicationId, applicant.getName()));
    }
}
