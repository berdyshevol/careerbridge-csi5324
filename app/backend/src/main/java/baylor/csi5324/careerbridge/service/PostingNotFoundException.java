package baylor.csi5324.careerbridge.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class PostingNotFoundException extends RuntimeException {

    public PostingNotFoundException(Long postingId) {
        super("Job posting " + postingId + " not found");
    }
}
