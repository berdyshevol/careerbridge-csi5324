package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.model.Applicant;

// CO-03.1: resume is null when the applicant has none on file yet
public record ProfileResponse(String firstName, String lastName, String email, String phone,
                              String location, String headline, String skills, String education,
                              String workExperience, ResumeResponse resume) {

    public static ProfileResponse from(Applicant applicant) {
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
                ResumeResponse.from(applicant.getResume()));
    }
}
