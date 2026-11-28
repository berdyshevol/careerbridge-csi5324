package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.ResumeSnapshot;
import baylor.csi5324.careerbridge.model.StatusHistoryEntry;

import java.util.List;

// CO-14.1 output. Holds this application only: the applicant's other applications are not reachable from
// it, so BR-15 cannot be broken by a screen that draws more than it should.
public record ApplicationReview(Long applicationId, Long postingId, String postingTitle, String applicantName,
                                ApplicationStatus stage, Applicant applicant, ResumeSnapshot resume,
                                List<StatusHistoryEntry> history) {
}
