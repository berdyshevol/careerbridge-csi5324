package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.service.ApplicationRefusal;

public record RefusalResponse(ApplicationRefusal reason, String message) {

    public static RefusalResponse of(ApplicationRefusal reason) {
        return new RefusalResponse(reason, reason.message());
    }
}
