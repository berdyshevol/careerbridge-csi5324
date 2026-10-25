package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.service.LoggedIn;

public record LoggedInResponse(String token, UserResponse user) {

    public static LoggedInResponse from(LoggedIn loggedIn) {
        return new LoggedInResponse(loggedIn.token(), UserResponse.from(loggedIn.user()));
    }
}
