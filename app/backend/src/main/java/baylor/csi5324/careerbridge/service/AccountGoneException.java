package baylor.csi5324.careerbridge.service;

// A valid token whose account no longer exists (a reset database, a deleted user)
public class AccountGoneException extends RuntimeException {

    public AccountGoneException(String email) {
        super("No applicant account for " + email);
    }
}
