package baylor.csi5324.careerbridge.service;

// The logged-in Recruiter may not act on this posting: only the Recruiter who created it may (CO-11.1)
public class PostingNotAllowedException extends RuntimeException {

    public PostingNotAllowedException(String message) {
        super(message);
    }
}
