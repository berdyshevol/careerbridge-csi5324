package baylor.csi5324.careerbridge.service;

// Its message is shown to the recruiter, so it must never carry internal details
public class InvalidPostingException extends RuntimeException {

    public InvalidPostingException(String message) {
        super(message);
    }
}
