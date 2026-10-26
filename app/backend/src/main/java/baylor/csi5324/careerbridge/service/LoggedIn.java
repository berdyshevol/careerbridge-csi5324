package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.User;

public record LoggedIn(String token, User user) {
}
