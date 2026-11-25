package baylor.csi5324.careerbridge.service;

import java.util.Map;

// UC-09 step 5 and UC-10 extensions 5a and 5b: every invalid field with its reason
public class MembershipRequestRefusedException extends RuntimeException {

    private final Map<String, String> fieldErrors;

    public MembershipRequestRefusedException(Map<String, String> fieldErrors) {
        super(fieldErrors.toString());
        this.fieldErrors = Map.copyOf(fieldErrors);
    }

    public Map<String, String> getFieldErrors() {
        return fieldErrors;
    }
}
