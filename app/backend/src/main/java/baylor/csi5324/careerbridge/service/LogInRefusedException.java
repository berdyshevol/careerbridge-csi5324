package baylor.csi5324.careerbridge.service;

// Its message is written for the person logging in
public class LogInRefusedException extends RuntimeException {

    public LogInRefusedException(String message) {
        super(message);
    }
}
