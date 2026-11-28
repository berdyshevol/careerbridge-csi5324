package baylor.csi5324.careerbridge.model;

// The application refused a move; the message is shown to the user as is, so it says what to do instead
public class ApplicationActionRefusedException extends RuntimeException {

    private final ApplicationStatus currentStage;

    public ApplicationActionRefusedException(ApplicationStatus currentStage, String message) {
        super(message);
        this.currentStage = currentStage;
    }

    public ApplicationStatus getCurrentStage() {
        return currentStage;
    }
}

