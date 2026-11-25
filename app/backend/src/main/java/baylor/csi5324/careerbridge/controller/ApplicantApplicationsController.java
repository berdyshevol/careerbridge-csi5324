package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.controller.dto.AcceptOfferRequest;
import baylor.csi5324.careerbridge.controller.dto.ActionRefusalResponse;
import baylor.csi5324.careerbridge.controller.dto.ApplicantApplicationsResponse;
import baylor.csi5324.careerbridge.controller.dto.ApplicationDetailResponse;
import baylor.csi5324.careerbridge.controller.dto.DeclineOfferRequest;
import baylor.csi5324.careerbridge.controller.dto.OfferDetailResponse;
import baylor.csi5324.careerbridge.controller.dto.OfferResponsePayload;
import baylor.csi5324.careerbridge.controller.dto.OfferRevisedResponse;
import baylor.csi5324.careerbridge.controller.dto.WithdrawApplicationRequest;
import baylor.csi5324.careerbridge.controller.dto.WithdrawalPromptResponse;
import baylor.csi5324.careerbridge.controller.dto.WithdrawalResponse;
import baylor.csi5324.careerbridge.service.ApplicationActionRefusedException;
import baylor.csi5324.careerbridge.service.ApplicationService;
import baylor.csi5324.careerbridge.service.OfferRevisedException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.time.Clock;

// CO-05.1, CO-05.2, CO-06.1, CO-06.2, CO-07.1, CO-07.2, CO-07.3
@RestController
@RequestMapping("/api/applicant/applications")
public class ApplicantApplicationsController {

    private final ApplicationService applicationService;
    private final Clock clock;

    public ApplicantApplicationsController(ApplicationService applicationService, Clock clock) {
        this.applicationService = applicationService;
        this.clock = clock;
    }

    @GetMapping
    public ApplicantApplicationsResponse viewApplications(Principal applicant) {
        return ApplicantApplicationsResponse.from(applicationService.viewApplications(applicant.getName()));
    }

    @GetMapping("/{applicationId}")
    public ApplicationDetailResponse viewApplication(@PathVariable Long applicationId, Principal applicant) {
        return ApplicationDetailResponse.from(
                applicationService.viewApplication(applicationId, applicant.getName()), clock.instant());
    }

    @GetMapping("/{applicationId}/withdrawal")
    public ResponseEntity<?> requestWithdrawal(@PathVariable Long applicationId, Principal applicant) {
        try {
            return ResponseEntity.ok(WithdrawalPromptResponse.from(
                    applicationService.requestWithdrawal(applicationId, applicant.getName())));
        } catch (ApplicationActionRefusedException refused) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ActionRefusalResponse.from(refused));
        }
    }

    @PostMapping("/{applicationId}/withdraw")
    public ResponseEntity<?> withdrawApplication(@PathVariable Long applicationId,
                                                 @RequestBody(required = false) WithdrawApplicationRequest body,
                                                 Principal applicant) {
        try {
            String reason = body == null ? null : body.reason();
            return ResponseEntity.ok(WithdrawalResponse.from(
                    applicationService.withdrawApplication(applicationId, applicant.getName(), reason)));
        } catch (ApplicationActionRefusedException refused) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ActionRefusalResponse.from(refused));
        }
    }

    @GetMapping("/{applicationId}/offer")
    public ResponseEntity<?> viewOffer(@PathVariable Long applicationId, Principal applicant) {
        try {
            return ResponseEntity.ok(OfferDetailResponse.from(
                    applicationService.viewOffer(applicationId, applicant.getName()), clock.instant()));
        } catch (ApplicationActionRefusedException refused) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ActionRefusalResponse.from(refused));
        }
    }

    @PostMapping("/{applicationId}/offer/accept")
    public ResponseEntity<?> acceptOffer(@PathVariable Long applicationId,
                                         @RequestBody(required = false) AcceptOfferRequest body,
                                         Principal applicant) {
        if (body == null || body.expectedRevision() == null) {
            return ResponseEntity.badRequest().body("Offer revision is required.");
        }
        try {
            return ResponseEntity.ok(OfferResponsePayload.from(
                    applicationService.acceptOffer(applicationId, applicant.getName(), body.expectedRevision())));
        } catch (OfferRevisedException revised) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(OfferRevisedResponse.from(revised));
        } catch (ApplicationActionRefusedException refused) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ActionRefusalResponse.from(refused));
        }
    }

    @PostMapping("/{applicationId}/offer/decline")
    public ResponseEntity<?> declineOffer(@PathVariable Long applicationId,
                                          @RequestBody(required = false) DeclineOfferRequest body,
                                          Principal applicant) {
        if (body == null || body.expectedRevision() == null) {
            return ResponseEntity.badRequest().body("Offer revision is required.");
        }
        try {
            return ResponseEntity.ok(OfferResponsePayload.from(
                    applicationService.declineOffer(
                            applicationId, applicant.getName(), body.reason(), body.expectedRevision())));
        } catch (OfferRevisedException revised) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(OfferRevisedResponse.from(revised));
        } catch (ApplicationActionRefusedException refused) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ActionRefusalResponse.from(refused));
        }
    }
}
