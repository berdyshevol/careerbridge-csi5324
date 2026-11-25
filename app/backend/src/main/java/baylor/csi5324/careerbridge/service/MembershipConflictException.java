package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.MembershipStatus;

// UC-09 extensions 6a and 6b, UC-10 extension 6a: the membership already has this status; nothing changed
public class MembershipConflictException extends RuntimeException {

    private final MembershipStatus status;

    public MembershipConflictException(MembershipStatus status, String message) {
        super(message);
        this.status = status;
    }

    public MembershipStatus getStatus() {
        return status;
    }
}
