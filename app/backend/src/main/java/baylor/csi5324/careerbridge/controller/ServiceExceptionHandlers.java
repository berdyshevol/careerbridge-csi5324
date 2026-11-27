package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.service.AccountGoneException;
import baylor.csi5324.careerbridge.service.ApplicationNotFoundException;
import baylor.csi5324.careerbridge.service.PostingNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

// Refusals that several controllers share; one controller's own refusals stay in that controller
@RestControllerAdvice
public class ServiceExceptionHandlers {

    // 401, not 404: the frontend treats it as an ended session and asks the user to log in again
    @ExceptionHandler(AccountGoneException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public String handleAccountGone(AccountGoneException ex) {
        return ex.getMessage();
    }

    @ExceptionHandler({PostingNotFoundException.class, ApplicationNotFoundException.class})
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public String handleNotFound(RuntimeException ex) {
        return ex.getMessage();
    }
}
