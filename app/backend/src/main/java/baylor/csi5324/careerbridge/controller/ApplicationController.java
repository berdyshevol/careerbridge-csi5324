package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.controller.dto.AcceptOfferRequest;
import baylor.csi5324.careerbridge.controller.dto.ApplicationDetailResponse;
import baylor.csi5324.careerbridge.controller.dto.ApplicationListResponse;
import baylor.csi5324.careerbridge.controller.dto.ApplicationResponse;
import baylor.csi5324.careerbridge.controller.dto.DeclineOfferRequest;
import baylor.csi5324.careerbridge.controller.dto.OfferDecisionResponse;
import baylor.csi5324.careerbridge.controller.dto.OfferResponse;
import baylor.csi5324.careerbridge.controller.dto.SubmitApplicationRequest;
import baylor.csi5324.careerbridge.controller.dto.WithdrawApplicationRequest;
import baylor.csi5324.careerbridge.controller.dto.WithdrawalRequestResponse;
import baylor.csi5324.careerbridge.service.ApplicationNotFoundException;
import baylor.csi5324.careerbridge.service.ApplicationRefusedException;
import baylor.csi5324.careerbridge.service.ApplicationService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @PostMapping("/postings/{postingId}/apply")
    @ResponseStatus(HttpStatus.CREATED)
    public ApplicationResponse submitApplication(@PathVariable Long postingId,
                                                 @RequestBody SubmitApplicationRequest request) {
        return ApplicationResponse.from(
                applicationService.submitApplication(postingId, request.toResumeSnapshot()));
    }

    @GetMapping("/applications")
    public ApplicationListResponse viewApplications() {
        return applicationService.viewApplications();
    }

    @GetMapping("/applications/{applicationId}")
    public ApplicationDetailResponse viewApplication(@PathVariable Long applicationId) {
        return applicationService.viewApplication(applicationId);
    }

    @GetMapping("/applications/{applicationId}/withdrawal")
    public WithdrawalRequestResponse requestWithdrawal(@PathVariable Long applicationId) {
        return applicationService.requestWithdrawal(applicationId);
    }

    @PostMapping("/applications/{applicationId}/withdraw")
    public ApplicationDetailResponse withdrawApplication(
            @PathVariable Long applicationId,
            @RequestBody(required = false) WithdrawApplicationRequest request) {
        return applicationService.withdrawApplication(
                applicationId, request == null ? null : request.reason());
    }

    @GetMapping("/applications/{applicationId}/offer")
    public OfferResponse viewOffer(@PathVariable Long applicationId) {
        return applicationService.viewOffer(applicationId);
    }

    @PostMapping("/applications/{applicationId}/offer/accept")
    public OfferDecisionResponse acceptOffer(
            @PathVariable Long applicationId,
            @RequestBody(required = false) AcceptOfferRequest request) {
        return applicationService.acceptOffer(
                applicationId,
                request == null ? null : request.expectedSalary(),
                request == null ? null : request.expectedExpirationDate());
    }

    @PostMapping("/applications/{applicationId}/offer/decline")
    public OfferDecisionResponse declineOffer(
            @PathVariable Long applicationId,
            @RequestBody(required = false) DeclineOfferRequest request) {
        return applicationService.declineOffer(
                applicationId, request == null ? null : request.reason());
    }

    // Only these exceptions: any other failure is the server's, not the applicant's
    @ExceptionHandler(ApplicationRefusedException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public String handleRefused(ApplicationRefusedException ex) {
        return ex.getMessage();
    }

    @ExceptionHandler(ApplicationNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public String handleNotFound(ApplicationNotFoundException ex) {
        return ex.getMessage();
    }
}
