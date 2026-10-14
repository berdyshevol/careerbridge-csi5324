package baylor.csi5324.careerbridge.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class ResumeRequiredException extends RuntimeException {

    public ResumeRequiredException() {
        super("A resume is required to apply");
    }
}
