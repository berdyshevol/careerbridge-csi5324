package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Resume;

import java.util.List;

// A refusal is data, not an exception: the screen shows it beside the summary and the active list
public record ApplicationStart(JobPosting posting, Applicant applicant, Resume resume,
                               List<Application> activeApplications, ApplicationRefusal refusal) {

    public long activeApplicationCount() {
        return activeApplications.size();
    }
}
