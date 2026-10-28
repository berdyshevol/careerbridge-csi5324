package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.model.Resume;

import java.time.LocalDateTime;

// CO-03.1 and CO-03.3: only the name and date; the file's type, size and content stay in the backend
public record ResumeResponse(String fileName, LocalDateTime uploadDate) {

    public static ResumeResponse from(Resume resume) {
        return new ResumeResponse(resume.getFileName(), resume.getUploadDate());
    }
}
