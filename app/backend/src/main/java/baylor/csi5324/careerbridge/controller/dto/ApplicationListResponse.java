package baylor.csi5324.careerbridge.controller.dto;

import java.util.List;

public record ApplicationListResponse(
        List<ApplicationSummaryResponse> applications,
        long activeApplicationCount) {
}

