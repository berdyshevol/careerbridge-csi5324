package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Organization;

import java.util.List;
import java.util.Map;

// The organization is null when the recruiter acts for none, and the list is then empty
public record RecruiterPostings(Organization organization, List<RecruiterPosting> postings) {

    // applicationsByStage holds every active stage, in pipeline order, also those with none (FR-UC14.1)
    public record RecruiterPosting(JobPosting posting, Map<ApplicationStatus, Long> applicationsByStage) {
    }
}
