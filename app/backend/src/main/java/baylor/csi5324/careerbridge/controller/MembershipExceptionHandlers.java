package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.controller.dto.MembershipConflictResponse;
import baylor.csi5324.careerbridge.controller.dto.OrganizationResponse;
import baylor.csi5324.careerbridge.controller.dto.RegistrationConflictResponse;
import baylor.csi5324.careerbridge.service.AlreadyRegisteredException;
import baylor.csi5324.careerbridge.service.MembershipConflictException;
import baylor.csi5324.careerbridge.service.MembershipNotFoundException;
import baylor.csi5324.careerbridge.service.MembershipRequestRefusedException;
import baylor.csi5324.careerbridge.service.OrganizationAlreadyRegisteredException;
import baylor.csi5324.careerbridge.service.RecruiterNotApprovedException;
import baylor.csi5324.careerbridge.service.RegistrationRefusedException;
import baylor.csi5324.careerbridge.service.VerificationLinkException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

// The refusals of UC-08, UC-09 and UC-10, each written for the person on the screen
@RestControllerAdvice(assignableTypes = {
        RecruiterRegistrationController.class, RecruiterMembershipController.class,
        AdminMembershipRequestController.class})
public class MembershipExceptionHandlers {

    // Field by field, so the form can put each reason next to its field
    @ExceptionHandler(RegistrationRefusedException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleRegistrationRefused(RegistrationRefusedException ex) {
        return ex.getFieldErrors();
    }

    @ExceptionHandler(MembershipRequestRefusedException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleRequestRefused(MembershipRequestRefusedException ex) {
        return ex.getFieldErrors();
    }

    @ExceptionHandler(AlreadyRegisteredException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public RegistrationConflictResponse handleEmailRegistered(AlreadyRegisteredException ex) {
        return new RegistrationConflictResponse(RegistrationConflictResponse.Reason.EMAIL_REGISTERED, ex.getMessage(), null);
    }

    @ExceptionHandler(OrganizationAlreadyRegisteredException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public RegistrationConflictResponse handleOrganizationRegistered(OrganizationAlreadyRegisteredException ex) {
        return new RegistrationConflictResponse(RegistrationConflictResponse.Reason.ORGANIZATION_REGISTERED,
                ex.getMessage(), OrganizationResponse.from(ex.getOrganization()));
    }

    @ExceptionHandler(MembershipConflictException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public MembershipConflictResponse handleConflict(MembershipConflictException ex) {
        return MembershipConflictResponse.from(ex);
    }

    // 410 for a link that expired (UC-08 6a), so the page can offer a new one; 404 for one never sent
    @ExceptionHandler(VerificationLinkException.class)
    public ResponseEntity<Map<String, Object>> handleVerificationLink(VerificationLinkException ex) {
        return ResponseEntity.status(ex.isExpired() ? HttpStatus.GONE : HttpStatus.NOT_FOUND)
                .body(Map.of("expired", ex.isExpired(), "message", ex.getMessage()));
    }

    @ExceptionHandler(RecruiterNotApprovedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public String handleNotApproved(RecruiterNotApprovedException ex) {
        return ex.getMessage();
    }

    @ExceptionHandler(MembershipNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public String handleNotFound(MembershipNotFoundException ex) {
        return ex.getMessage();
    }
}
