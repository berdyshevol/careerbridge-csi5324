package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.Application;

public record SubmittedApplication(Application application, long activeApplicationCount) {
}
