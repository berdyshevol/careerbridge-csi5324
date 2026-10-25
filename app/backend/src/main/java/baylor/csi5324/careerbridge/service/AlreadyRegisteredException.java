package baylor.csi5324.careerbridge.service;

// UC-02 extension 4b; its message is written for the visitor
public class AlreadyRegisteredException extends RuntimeException {

    public AlreadyRegisteredException() {
        super("An account already exists for this email address. Log in instead.");
    }
}
