package baylor.csi5324.careerbridge.model;

import jakarta.persistence.Entity;

import java.time.Instant;

@Entity
public class Recruiter extends User {

    // UC-08 step 3
    private String jobTitle;

    // UC-08 steps 5-7. Null for a recruiter created before verification existed: counted as verified.
    private Boolean emailVerified;
    // Only the token's hash is kept, as for a password: whoever reads the table cannot verify the email
    private String verificationTokenHash;
    private Instant verificationExpiresAt;

    public Recruiter() {
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }

    public boolean isEmailVerified() {
        return emailVerified == null || emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public String getVerificationTokenHash() {
        return verificationTokenHash;
    }

    public Instant getVerificationExpiresAt() {
        return verificationExpiresAt;
    }

    public void startVerification(String tokenHash, Instant expiresAt) {
        this.verificationTokenHash = tokenHash;
        this.verificationExpiresAt = expiresAt;
    }

    public void markEmailVerified() {
        this.emailVerified = true;
        this.verificationTokenHash = null;
        this.verificationExpiresAt = null;
    }
}
