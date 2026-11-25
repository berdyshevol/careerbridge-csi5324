package baylor.csi5324.careerbridge.service;

// UC-02 extension 2b; its message is written for the visitor
public class AlreadyRegisteredException extends RuntimeException {

    public AlreadyRegisteredException() {
        this("An account already exists for this email address. Log in instead.");
    }

    // UC-08 extension 4b: an approved recruiter is pointed to UC-09 instead
    public AlreadyRegisteredException(String message) {
        super(message);
    }
}
