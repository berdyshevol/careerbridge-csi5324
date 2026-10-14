package baylor.csi5324.careerbridge.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicateApplicationException extends RuntimeException {

    public DuplicateApplicationException(Long postingId) {
        super("An application has already been submitted for posting " + postingId);
    }
}
