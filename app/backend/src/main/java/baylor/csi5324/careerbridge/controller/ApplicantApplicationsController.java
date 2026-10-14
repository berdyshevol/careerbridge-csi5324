package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.controller.dto.ActiveApplicationResponse;
import baylor.csi5324.careerbridge.service.ApplicationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// Read-only: the screen of UC-04 uses it to say up front why a posting cannot be
// applied to. The backend still decides on submit (CO-04.1).
@RestController
@RequestMapping("/api/applicant/applications")
public class ApplicantApplicationsController {

    private final ApplicationService applicationService;

    public ApplicantApplicationsController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @GetMapping
    public List<ActiveApplicationResponse> activeApplications() {
        return applicationService.activeApplications().stream()
                .map(ActiveApplicationResponse::from)
                .toList();
    }
}
