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
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

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
                                                     SubmitApplicationRequest resume) {
        return ApplicationStartResponse.from(
                applicationService.startApplication(postingId, resume.toResumeSnapshot()));
    }

    @PostMapping("/application")
    public ResponseEntity<?> submitApplicationWithReason(@PathVariable Long postingId,
                                                         @RequestBody SubmitApplicationRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(ApplicationResponse.from(
                    applicationService.submitApplication(postingId, request.toResumeSnapshot())));
        } catch (ApplicationRefusedException refused) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(RefusalResponse.of(refused.getReason()));
        }
    }

    // The screen built on this endpoint reads a refusal as plain text; /application names the reason instead
    @PostMapping("/apply")
    @ResponseStatus(HttpStatus.CREATED)
    public ApplicationResponse submitApplication(@PathVariable Long postingId,
                                                 @RequestBody SubmitApplicationRequest request) {
        return ApplicationResponse.from(
                applicationService.submitApplication(postingId, request.toResumeSnapshot()));
    }

    // Only this exception: any other failure is the server's, not the applicant's
    @ExceptionHandler(ApplicationRefusedException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public String handleRefused(ApplicationRefusedException ex) {
        return ex.getMessage();
    }
}
