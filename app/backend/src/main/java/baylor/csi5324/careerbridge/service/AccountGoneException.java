package baylor.csi5324.careerbridge.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

// A valid token whose account no longer exists (a reset database, a deleted user): the frontend
// treats the 401 as an ended session and asks the user to log in again
@ResponseStatus(HttpStatus.UNAUTHORIZED)
public class AccountGoneException extends RuntimeException {

    public AccountGoneException(String email) {
        super("No applicant account for " + email);
    }
}
