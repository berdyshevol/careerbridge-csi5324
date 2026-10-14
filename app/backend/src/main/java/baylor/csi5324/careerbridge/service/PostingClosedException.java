package baylor.csi5324.careerbridge.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class PostingClosedException extends RuntimeException {

    public PostingClosedException(Long postingId) {
        super("Job posting " + postingId + " is no longer accepting applications");
    }
}
