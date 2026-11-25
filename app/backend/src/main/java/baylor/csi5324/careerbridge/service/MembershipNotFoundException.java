package baylor.csi5324.careerbridge.service;

public class MembershipNotFoundException extends RuntimeException {

    public MembershipNotFoundException(Long membershipId) {
        super("No request has the id " + membershipId + ".");
    }
}
