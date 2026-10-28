
package baylor.csi5324.careerbridge.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Resume {

    // UC-03 extension 6a
    public static final int MAX_FILE_SIZE = 5 * 1024 * 1024;

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long resumeId;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String fileType;

    @Column(nullable = false)
    private Long fileSize;

    @Column(nullable = false)
    private LocalDateTime uploadDate;

    // bytea on PostgreSQL and varbinary on H2. Not @Lob: on PostgreSQL that is a large object, which
    // outlives a deleted row. Nullable, as rows saved before uploads existed have no content.
    @Column(length = MAX_FILE_SIZE)
    private byte[] content;

    public Resume() {
    }

    public Resume(String fileName, String fileType, long fileSize, byte[] content, LocalDateTime uploadDate) {
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.content = content;
        this.uploadDate = uploadDate;
    }

    public Long getResumeId() {
        return resumeId;
    }

    public void setResumeId(Long resumeId) {
        this.resumeId = resumeId;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public LocalDateTime getUploadDate() {
        return uploadDate;
    }

    public void setUploadDate(LocalDateTime uploadDate) {
        this.uploadDate = uploadDate;
    }

    public byte[] getContent() {
        return content;
    }
}
