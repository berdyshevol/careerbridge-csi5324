package baylor.csi5324.careerbridge.service;

public class UserNotFoundException extends RuntimeException {

    public UserNotFoundException() {
        super("That user does not exist.");
    }
}
