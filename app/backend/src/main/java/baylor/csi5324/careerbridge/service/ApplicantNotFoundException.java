package baylor.csi5324.careerbridge.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class ApplicantNotFoundException extends RuntimeException {

    public ApplicantNotFoundException(Long applicantId) {
        super("Applicant not found: " + applicantId);
    }
}
