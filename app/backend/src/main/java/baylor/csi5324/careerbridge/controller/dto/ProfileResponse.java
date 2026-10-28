package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Resume;

import java.time.LocalDateTime;

// CO-03.1: resume is null when the applicant has none on file yet
public record ProfileResponse(String firstName, String lastName, String email, String phone,
                              String location, String headline, String skills, String education,
                              String workExperience, ResumeOnFile resume) {

    public record ResumeOnFile(String fileName, LocalDateTime uploadDate) {
    }

    public static ProfileResponse from(Applicant applicant) {
        Resume resume = applicant.getResume();
        return new ProfileResponse(
                applicant.getFirstName(),
                applicant.getLastName(),
                applicant.getEmail(),
                applicant.getPhone(),
                applicant.getLocation(),
                applicant.getHeadline(),
                applicant.getSkills(),
                applicant.getEducation(),
                applicant.getWorkExperience(),
                resume == null ? null : new ResumeOnFile(resume.getFileName(), resume.getUploadDate()));
    }
}
