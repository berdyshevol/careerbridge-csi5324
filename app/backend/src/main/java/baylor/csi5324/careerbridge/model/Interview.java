package baylor.csi5324.careerbridge.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "interviews")
public class Interview {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long interviewId;

    @Column(nullable = false)
    private LocalDateTime scheduledTime;

    private String format;
    private String location;
    private String outcome;

    @Column(length = 2000)
    private String notes;

    public Interview() {
    }

    public Interview(LocalDateTime scheduledTime, String format, String location,
                     String outcome, String notes) {
        this.scheduledTime = scheduledTime;
        this.format = format;
        this.location = location;
        this.outcome = outcome;
        this.notes = notes;
    }

    public Long getInterviewId() {
        return interviewId;
    }

    public LocalDateTime getScheduledTime() {
        return scheduledTime;
    }

    public void setScheduledTime(LocalDateTime scheduledTime) {
        this.scheduledTime = scheduledTime;
    }

    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getOutcome() {
        return outcome;
    }

    public void setOutcome(String outcome) {
        this.outcome = outcome;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}

