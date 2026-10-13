package baylor.csi5324.careerbridge.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

import java.time.LocalDate;

@Embeddable
public class StatusHistoryEntry {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status;

    @Column(name = "entry_date", nullable = false)
    private LocalDate date;

    public StatusHistoryEntry() {
    }

    public StatusHistoryEntry(ApplicationStatus status, LocalDate date) {
        this.status = status;
        this.date = date;
    }

    public ApplicationStatus getStatus() {
        return status;
    }

    public LocalDate getDate() {
        return date;
    }
}
