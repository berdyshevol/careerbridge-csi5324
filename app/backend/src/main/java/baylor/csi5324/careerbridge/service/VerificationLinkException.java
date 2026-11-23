package baylor.csi5324.careerbridge.service;

// UC-08 extension 6a, and a link that was never sent or was already used
public class VerificationLinkException extends RuntimeException {

    private final boolean expired;

    public VerificationLinkException(boolean expired) {
        super(expired ? "This link has expired. Ask for a new one."
                : "This link is not valid. It may have been used already: try logging in.");
        this.expired = expired;
    }

    public boolean isExpired() {
        return expired;
    }
}
