package baylor.csi5324.careerbridge.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.OrderBy;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

// One application per applicant and posting, withdrawn ones included (A5)
@Entity
@Table(name = "applications",
        uniqueConstraints = @UniqueConstraint(columnNames = {"applicant_id", "job_post_id"}))
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long applicationId;

    @ManyToOne(optional = false)
    @JoinColumn(name = "applicant_id")
    private Applicant applicant;

    @ManyToOne(optional = false)
    @JoinColumn(name = "job_post_id")
    private JobPosting jobPosting;

    @Column(nullable = false)
    private LocalDate dateApplied;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus applicationStatus = ApplicationStatus.APPLIED;

    private String rejectionReason;
    private Instant withdrawnAt;

    // A copy, not a link to the Resume: later changes to the resume must not reach it (A6)
    @Embedded
    private ResumeSnapshot resumeSnapshot;

    @ElementCollection
    @CollectionTable(name = "application_status_history",
            joinColumns = @JoinColumn(name = "application_id"))
    @OrderColumn
    private List<StatusHistoryEntry> statusHistory = new ArrayList<>();

    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("roundNumber ASC, scheduledTime ASC")
    private List<Interview> interviews = new ArrayList<>();

    @OneToOne(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true)
    private Offer offer;

    public Application() {
    }

    public Application(Applicant applicant, JobPosting jobPosting, ResumeSnapshot resumeSnapshot,
                       LocalDate dateApplied) {
        this.applicant = applicant;
        this.jobPosting = jobPosting;
        this.resumeSnapshot = resumeSnapshot;
        this.dateApplied = dateApplied;
        statusHistory.add(new StatusHistoryEntry(ApplicationStatus.APPLIED, dateApplied));
    }

    public Long getApplicationId() {
        return applicationId;
    }

    public Applicant getApplicant() {
        return applicant;
    }

    public JobPosting getJobPosting() {
        return jobPosting;
    }

    public LocalDate getDateApplied() {
        return dateApplied;
    }

    public ApplicationStatus getApplicationStatus() {
        return applicationStatus;
    }

    // Written only by the lifecycle package (LayersTest): the stage and its history entry change together
    public void enterStage(ApplicationStatus stage, LocalDate date, String note) {
        this.applicationStatus = stage;
        statusHistory.add(new StatusHistoryEntry(stage, date, note));
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void recordRejection(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public ApplicationStatus getRejectedAtStage() {
        for (int i = statusHistory.size() - 1; i >= 0; i--) {
            if (statusHistory.get(i).getStatus() == ApplicationStatus.REJECTED) {
                return i > 0 ? statusHistory.get(i - 1).getStatus() : null;
            }
        }
        return null;
    }

    public LocalDate getRejectionDate() {
        for (int i = statusHistory.size() - 1; i >= 0; i--) {
            StatusHistoryEntry entry = statusHistory.get(i);
            if (entry.getStatus() == ApplicationStatus.REJECTED) {
                return entry.getDate();
            }
        }
        return null;
    }

    public List<Interview> getInterviews() {
        return interviews;
    }

    public Offer getOffer() {
        return offer;
    }

    public void setOffer(Offer offer) {
        this.offer = offer;
    }

    public Instant getWithdrawnAt() {
        return withdrawnAt;
    }

    public void recordWithdrawal(Instant withdrawnAt) {
        this.withdrawnAt = withdrawnAt;
    }

    public ResumeSnapshot getResumeSnapshot() {
        return resumeSnapshot;
    }

    // Read-only: an entry is added only together with a stage, by enterStage
    public List<StatusHistoryEntry> getStatusHistory() {
        return Collections.unmodifiableList(statusHistory);
    }

    public boolean isActive() {
        return applicationStatus.isActive();
    }

    public LocalDate getLastStageChangeDate() {
        if (statusHistory.isEmpty()) {
            return dateApplied;
        }
        return statusHistory.get(statusHistory.size() - 1).getDate();
    }
}
