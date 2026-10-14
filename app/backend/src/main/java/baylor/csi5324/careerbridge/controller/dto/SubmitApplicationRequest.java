package baylor.csi5324.careerbridge.controller.dto;

public class SubmitApplicationRequest {

    private Long applicantId;
    private String resumeFileName;
    private String resumeFileType;
    private Long resumeFileSize;

    public SubmitApplicationRequest() {
    }

    public SubmitApplicationRequest(Long applicantId, String resumeFileName, String resumeFileType, Long resumeFileSize) {
        this.applicantId = applicantId;
        this.resumeFileName = resumeFileName;
        this.resumeFileType = resumeFileType;
        this.resumeFileSize = resumeFileSize;
    }

    public Long getApplicantId() {
        return applicantId;
    }

    public void setApplicantId(Long applicantId) {
        this.applicantId = applicantId;
    }

    public String getResumeFileName() {
        return resumeFileName;
    }

    public void setResumeFileName(String resumeFileName) {
        this.resumeFileName = resumeFileName;
    }

    public String getResumeFileType() {
        return resumeFileType;
    }

    public void setResumeFileType(String resumeFileType) {
        this.resumeFileType = resumeFileType;
    }

    public Long getResumeFileSize() {
        return resumeFileSize;
    }

    public void setResumeFileSize(Long resumeFileSize) {
        this.resumeFileSize = resumeFileSize;
    }
}
