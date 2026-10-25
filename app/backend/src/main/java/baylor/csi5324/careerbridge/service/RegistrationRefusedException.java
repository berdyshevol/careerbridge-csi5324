package baylor.csi5324.careerbridge.service;

import java.util.Map;

// UC-02 extensions 4a and 4c: every invalid field with its reason, written for the visitor
public class RegistrationRefusedException extends RuntimeException {

    private final Map<String, String> fieldErrors;

    public RegistrationRefusedException(Map<String, String> fieldErrors) {
        super(fieldErrors.toString()); // for the log; the visitor sees the fields
        this.fieldErrors = Map.copyOf(fieldErrors);
    }

    public Map<String, String> getFieldErrors() {
        return fieldErrors;
    }
}
