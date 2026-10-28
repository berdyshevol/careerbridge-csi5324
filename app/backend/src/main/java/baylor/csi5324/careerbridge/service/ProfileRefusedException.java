package baylor.csi5324.careerbridge.service;

import java.util.Map;

// UC-03 extension 4a: every invalid field with its reason, written for the applicant
public class ProfileRefusedException extends RuntimeException {

    private final Map<String, String> fieldErrors;

    public ProfileRefusedException(Map<String, String> fieldErrors) {
        super(fieldErrors.toString()); // for the log; the applicant sees the fields
        this.fieldErrors = Map.copyOf(fieldErrors);
    }

    public Map<String, String> getFieldErrors() {
        return fieldErrors;
    }
}
