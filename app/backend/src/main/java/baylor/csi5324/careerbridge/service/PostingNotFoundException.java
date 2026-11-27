package baylor.csi5324.careerbridge.service;

public class PostingNotFoundException extends RuntimeException {

    public PostingNotFoundException(Long postingId) {
        super("Job posting " + postingId + " not found");
    }
}
