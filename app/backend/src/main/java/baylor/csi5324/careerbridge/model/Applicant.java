package baylor.csi5324.careerbridge.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;

@Entity
public class Applicant extends User {

    // Domain model 5.3: at most one resume on file (BR-6). Eager, as the profile always shows it.
    @OneToOne
    @JoinColumn(name = "resume_id")
    private Resume resume;

    // UC-03 step 2, FR-UC03.1: free text the applicant writes about themselves; all optional.
    // The lengths are the ones ApplicantProfileService checks.
    private String location;

    private String headline;

    @Column(length = 2000)
    private String skills;

    @Column(length = 4000)
    private String education;

    @Column(length = 10000)
    private String workExperience;

    public Applicant() {
    }

    public Resume getResume() {
        return resume;
    }

    public void setResume(Resume resume) {
        this.resume = resume;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getHeadline() {
        return headline;
    }

    public void setHeadline(String headline) {
        this.headline = headline;
    }

    public String getSkills() {
        return skills;
    }

    public void setSkills(String skills) {
        this.skills = skills;
    }

    public String getEducation() {
        return education;
    }

    public void setEducation(String education) {
        this.education = education;
    }

    public String getWorkExperience() {
        return workExperience;
    }

    public void setWorkExperience(String workExperience) {
        this.workExperience = workExperience;
    }
}
