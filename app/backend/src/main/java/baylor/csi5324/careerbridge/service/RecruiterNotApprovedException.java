package baylor.csi5324.careerbridge.service;

// CO-09.1 preconditions, BR-14: only an approved recruiter with an Active membership joins another organization
public class RecruiterNotApprovedException extends RuntimeException {

    public RecruiterNotApprovedException() {
        super("Your recruiter account is not approved yet. You can join another organization once it is.");
    }
}
