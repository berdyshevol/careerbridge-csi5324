package baylor.csi5324.careerbridge.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class ApplicationLimitExceededException extends RuntimeException {

    public ApplicationLimitExceededException(int limit) {
        super("Maximum of " + limit + " active applications allowed at once");
    }
}
