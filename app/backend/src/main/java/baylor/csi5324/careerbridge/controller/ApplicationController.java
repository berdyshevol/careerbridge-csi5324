package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.controller.dto.ApplicationResponse;
import baylor.csi5324.careerbridge.controller.dto.SubmitApplicationRequest;
import baylor.csi5324.careerbridge.service.ApplicationRefusedException;
import baylor.csi5324.careerbridge.service.ApplicationService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/postings/{postingId}/apply")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApplicationResponse submitApplication(@PathVariable Long postingId,
                                                 @RequestBody SubmitApplicationRequest request,
                                                 Principal applicant) {
        return ApplicationResponse.from(
                applicationService.submitApplication(postingId, request.toResumeSnapshot(), applicant.getName()));
    }

    // Only this exception: any other failure is the server's, not the applicant's
    @ExceptionHandler(ApplicationRefusedException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public String handleRefused(ApplicationRefusedException ex) {
        return ex.getMessage();
    }
}
