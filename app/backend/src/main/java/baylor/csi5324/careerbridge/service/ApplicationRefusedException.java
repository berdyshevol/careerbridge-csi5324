package baylor.csi5324.careerbridge.service;

public class ApplicationRefusedException extends RuntimeException {

    private final ApplicationRefusal reason;

    public ApplicationRefusedException(ApplicationRefusal reason) {
        super(reason.message());
        this.reason = reason;
    }

    public ApplicationRefusal getReason() {
        return reason;
    }
}
