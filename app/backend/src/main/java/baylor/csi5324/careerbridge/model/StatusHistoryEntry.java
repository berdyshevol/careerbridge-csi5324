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

    @Column(length = 2000)
    private String reason;

    public StatusHistoryEntry() {
    }

    public StatusHistoryEntry(ApplicationStatus status, LocalDate date) {
        this(status, date, null);
    }

    public StatusHistoryEntry(ApplicationStatus status, LocalDate date, String reason) {
        this.status = status;
        this.date = date;
        this.reason = reason;
    }

    public ApplicationStatus getStatus() {
        return status;
    }

    public LocalDate getDate() {
        return date;
    }

    public String getReason() {
        return reason;
    }
}
