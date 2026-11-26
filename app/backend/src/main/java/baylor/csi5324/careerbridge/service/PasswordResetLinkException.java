package baylor.csi5324.careerbridge.service;

// A reset link that has expired, was replaced by a newer one, or was already used
public class PasswordResetLinkException extends RuntimeException {

    private final boolean expired;

    public PasswordResetLinkException(boolean expired) {
        super(expired ? "This link has expired. Ask for a new one."
                : "This link does not work. It may have been used already or replaced by a newer one: ask for a new one.");
        this.expired = expired;
    }

    public boolean isExpired() {
        return expired;
    }
}
