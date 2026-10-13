package baylor.csi5324.careerbridge.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class ResumeSnapshot {

    @Column(name = "resume_file_name", nullable = false)
    private String fileName;

    @Column(name = "resume_file_type", nullable = false)
    private String fileType;

    @Column(name = "resume_file_size", nullable = false)
    private long fileSize;

    public ResumeSnapshot() {
    }

    public ResumeSnapshot(String fileName, String fileType, long fileSize) {
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
    }

    public String getFileName() {
        return fileName;
    }

    public String getFileType() {
        return fileType;
    }

    public long getFileSize() {
        return fileSize;
    }
}
