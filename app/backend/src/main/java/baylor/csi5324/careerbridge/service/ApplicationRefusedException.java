package baylor.csi5324.careerbridge.service;

// Its message is shown to the applicant, so it must never carry internal details
public class ApplicationRefusedException extends RuntimeException {

    public ApplicationRefusedException(String message) {
        super(message);
    }
}
