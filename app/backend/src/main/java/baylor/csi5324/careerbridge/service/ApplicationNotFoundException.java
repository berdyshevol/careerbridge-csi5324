package baylor.csi5324.careerbridge.service;

public class ApplicationNotFoundException extends RuntimeException {

    public ApplicationNotFoundException(Long applicationId) {
        super("Application not found: " + applicationId);
    }
}

