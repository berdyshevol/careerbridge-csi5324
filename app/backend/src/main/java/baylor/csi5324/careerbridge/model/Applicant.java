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

    public static final int MAX_LINE_LENGTH = 255; // the default column length
    public static final int MAX_SKILLS_LENGTH = 2000;
    public static final int MAX_EDUCATION_LENGTH = 4000;
    public static final int MAX_WORK_EXPERIENCE_LENGTH = 10000;

    // UC-03 step 2, FR-UC03.1: free text the applicant writes about themselves; all optional
    private String location;

    private String headline;

    @Column(length = MAX_SKILLS_LENGTH)
    private String skills;

    @Column(length = MAX_EDUCATION_LENGTH)
    private String education;

    @Column(length = MAX_WORK_EXPERIENCE_LENGTH)
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
