package baylor.csi5324.careerbridge.repository;

import baylor.csi5324.careerbridge.model.ApplicationStatus;

public record StageCount(Long jobPostId, ApplicationStatus applicationStatus, long applications) {
}
