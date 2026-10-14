package baylor.csi5324.careerbridge.service;

// The posting is no longer in the status the caller saw, e.g. another Administrator decided it
public class PostingStateConflictException extends RuntimeException {

    public PostingStateConflictException(String message) {
        super(message);
    }
}
