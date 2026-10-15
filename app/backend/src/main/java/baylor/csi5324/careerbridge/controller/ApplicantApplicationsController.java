package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.controller.dto.ApplicationSummaryResponse;
import baylor.csi5324.careerbridge.service.ApplicationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// CO-05.1, ended applications included: the apply screen needs them to say up
// front that a posting was applied to (A5). The backend still decides on submit (CO-04.1).
@RestController
@RequestMapping("/api/applicant/applications")
public class ApplicantApplicationsController {

    private final ApplicationService applicationService;

    public ApplicantApplicationsController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @GetMapping
    public List<ApplicationSummaryResponse> viewApplications() {
        return applicationService.viewApplications().stream()
                .map(ApplicationSummaryResponse::from)
                .toList();
    }
}
