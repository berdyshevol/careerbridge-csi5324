package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.model.MembershipStatus;
import baylor.csi5324.careerbridge.service.MembershipConflictException;

// UC-09 6a and 6b, UC-10 6a: the status the membership already has, for the screen to show
public record MembershipConflictResponse(MembershipStatus status, String statusLabel, String message) {

    public static MembershipConflictResponse from(MembershipConflictException ex) {
        return new MembershipConflictResponse(ex.getStatus(), ex.getStatus().getLabel(), ex.getMessage());
    }
}
