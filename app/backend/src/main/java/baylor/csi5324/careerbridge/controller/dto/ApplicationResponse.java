package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.model.ApplicationStatus;
import java.time.LocalDate;

public class ApplicationResponse {

    private Long applicationId;
    private Long jobPostId;
    private String jobTitle;
    private String organizationName;
    private LocalDate dateApplied;
    private ApplicationStatus applicationStatus;
    private String resumeFileName;
    private long activeApplicationCount;

    public ApplicationResponse() {
    }

    public ApplicationResponse(Long applicationId, Long jobPostId, String jobTitle,
                               String organizationName, LocalDate dateApplied,
                               ApplicationStatus applicationStatus, String resumeFileName,
                               long activeApplicationCount) {
        this.applicationId = applicationId;
        this.jobPostId = jobPostId;
        this.jobTitle = jobTitle;
        this.organizationName = organizationName;
        this.dateApplied = dateApplied;
        this.applicationStatus = applicationStatus;
        this.resumeFileName = resumeFileName;
        this.activeApplicationCount = activeApplicationCount;
    }

    public Long getApplicationId() {
        return applicationId;
    }

    public Long getJobPostId() {
        return jobPostId;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public String getOrganizationName() {
        return organizationName;
    }

    public LocalDate getDateApplied() {
        return dateApplied;
    }

    public ApplicationStatus getApplicationStatus() {
        return applicationStatus;
    }

    public String getResumeFileName() {
        return resumeFileName;
    }

    public long getActiveApplicationCount() {
        return activeApplicationCount;
    }
}
