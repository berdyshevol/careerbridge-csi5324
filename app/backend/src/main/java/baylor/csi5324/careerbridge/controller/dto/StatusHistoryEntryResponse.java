package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.StatusHistoryEntry;

import java.time.LocalDate;

public record StatusHistoryEntryResponse(
        ApplicationStatus status,
        LocalDate date,
        String reason) {

    public static StatusHistoryEntryResponse from(StatusHistoryEntry entry) {
        return new StatusHistoryEntryResponse(
                entry.getStatus(),
                entry.getDate(),
                entry.getReason());
    }
}

