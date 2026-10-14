package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.model.ResumeSnapshot;

public record SubmitApplicationRequest(String resumeFileName, String resumeFileType, Long resumeFileSize) {

    // Null when the applicant has no resume on file, which the service refuses
    public ResumeSnapshot toResumeSnapshot() {
        if (resumeFileName == null || resumeFileType == null || resumeFileSize == null) {
            return null;
        }
        return new ResumeSnapshot(resumeFileName, resumeFileType, resumeFileSize);
    }
}
