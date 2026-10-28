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

    // A copy of the file, since a replaced Resume is deleted (A6). The same mapping as Resume.content;
    // nullable, as snapshots taken before uploads existed have no content.
    @Column(name = "resume_content", length = Resume.MAX_FILE_SIZE)
    private byte[] content;

    public ResumeSnapshot() {
    }

    public ResumeSnapshot(String fileName, String fileType, long fileSize) {
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
    }

    // Domain model 5.4 #4: the resume on file as it is at submission, in the format the applicant uploaded
    public static ResumeSnapshot of(Resume resume) {
        ResumeSnapshot snapshot = new ResumeSnapshot(resume.getFileName(), resume.getFileType(), resume.getFileSize());
        snapshot.content = resume.getContent() == null ? null : resume.getContent().clone();
        return snapshot;
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

    public byte[] getContent() {
        return content;
    }
}
