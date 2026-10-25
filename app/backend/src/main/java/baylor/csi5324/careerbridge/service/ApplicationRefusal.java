package baylor.csi5324.careerbridge.service;

// The message is shown to the applicant, so it must never carry internal details
public enum ApplicationRefusal {
    POSTING_CLOSED("This posting no longer accepts applications."),
    NO_RESUME("A resume is required to apply. "
            + "Upload one in Profile & resume, then come back to this posting."),
    LIMIT_REACHED("You have " + ApplicationService.APPLICATION_LIMIT
            + " active applications, the most allowed at once. A slot frees up when you "
            + "withdraw one or it reaches Hired, Rejected or Offer Declined."),
    ALREADY_APPLIED("You already applied to this posting. A posting can be applied to once.");

    private final String message;

    ApplicationRefusal(String message) {
        this.message = message;
    }

    public String message() {
        return message;
    }
}
