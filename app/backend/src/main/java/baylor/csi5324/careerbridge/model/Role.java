package baylor.csi5324.careerbridge.model;

// The role a logged-in user acts in; it follows from which kind of User the account is
public enum Role {
    APPLICANT,
    RECRUITER,
    ADMINISTRATOR;

    public static Role of(User user) {
        if (user instanceof Applicant) {
            return APPLICANT;
        }
        if (user instanceof Recruiter) {
            return RECRUITER;
        }
        if (user instanceof Administrator) {
            return ADMINISTRATOR;
        }
        throw new IllegalArgumentException("A plain User has no role: " + user.getEmail());
    }
}
