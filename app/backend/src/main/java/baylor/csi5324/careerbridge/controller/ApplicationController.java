package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.controller.dto.ApplicationResponse;
import baylor.csi5324.careerbridge.controller.dto.ApplicationStartResponse;
import baylor.csi5324.careerbridge.controller.dto.RefusalResponse;
import baylor.csi5324.careerbridge.controller.dto.SubmitApplicationRequest;
import baylor.csi5324.careerbridge.service.ApplicationRefusedException;
import baylor.csi5324.careerbridge.service.ApplicationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/postings/{postingId}")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    // STAND-IN: the resume rides in the query until UC-03 keeps it in the backend
    @GetMapping("/application")
    public ApplicationStartResponse startApplication(@PathVariable Long postingId,
                                                     SubmitApplicationRequest resume,
                                                     Principal applicant) {
        return ApplicationStartResponse.from(
                applicationService.startApplication(postingId, resume.toResumeSnapshot(), applicant.getName()));
    }

    @PostMapping("/application")
    public ResponseEntity<?> submitApplication(@PathVariable Long postingId,
                                               @RequestBody SubmitApplicationRequest request,
                                               Principal applicant) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(ApplicationResponse.from(
                    applicationService.submitApplication(postingId, request.toResumeSnapshot(), applicant.getName())));
        } catch (ApplicationRefusedException refused) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(RefusalResponse.of(refused.getReason()));
        }
    }
}
