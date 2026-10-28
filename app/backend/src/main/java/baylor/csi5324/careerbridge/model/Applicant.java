package baylor.csi5324.careerbridge.model;

import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;

@Entity
public class Applicant extends User {

    // Domain model 5.3: at most one resume on file (BR-6). Eager, as the profile always shows it.
    @OneToOne
    @JoinColumn(name = "resume_id")
    private Resume resume;

    public Applicant() {
    }

    public Resume getResume() {
        return resume;
    }

    public void setResume(Resume resume) {
        this.resume = resume;
    }
}
