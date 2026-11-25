package baylor.csi5324.careerbridge.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "interviews")
public class Interview {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long interviewId;

    @ManyToOne(optional = false)
    @JoinColumn(name = "application_id")
    private Application application;

    @Column(nullable = false)
    private int roundNumber = 1;

    @Column(nullable = false)
    private LocalDateTime scheduledTime;

    @Column(nullable = false)
    private String format;

    @Column(nullable = false)
    private String location;

    // Recruiter-only fields (BR-12, A12): never included in applicant responses
    private String outcome;

    @Column(length = 2000)
    private String notes;

    public Interview() {
    }

    public Interview(Application application, int roundNumber, LocalDateTime scheduledTime,
                     String format, String location) {
        this.application = application;
        this.roundNumber = roundNumber;
        this.scheduledTime = scheduledTime;
        this.format = format;
        this.location = location;
    }

    public Long getInterviewId() {
        return interviewId;
    }

    public Application getApplication() {
        return application;
    }

    public int getRoundNumber() {
        return roundNumber;
    }

    public LocalDateTime getScheduledTime() {
        return scheduledTime;
    }

    public String getFormat() {
        return format;
    }

    public String getLocation() {
        return location;
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

