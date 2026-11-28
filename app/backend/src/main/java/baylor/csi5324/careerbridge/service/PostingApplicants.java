package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.JobPosting;

import java.util.List;

// The applicants of one posting at its active stages, in pipeline order and then by date applied
public record PostingApplicants(JobPosting posting, List<Applicant> applicants) {

    public record Applicant(Long applicationId, String name, ApplicationStatus stage) {
    }
}
