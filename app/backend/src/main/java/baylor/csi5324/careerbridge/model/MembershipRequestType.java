package baylor.csi5324.careerbridge.model;

// UC-10 step 2: the three kinds of request in the queue, plus UC-09 extension 3a
public enum MembershipRequestType {
    NEW_RECRUITER_NEW_ORGANIZATION("New recruiter, new organization"),
    NEW_RECRUITER_EXISTING_ORGANIZATION("New recruiter, existing organization"),
    ADDITIONAL_ORGANIZATION("Additional organization"),
    ADDITIONAL_NEW_ORGANIZATION("Additional organization, new organization");

    private final String label;

    MembershipRequestType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public boolean createsOrganization() {
        return this == NEW_RECRUITER_NEW_ORGANIZATION || this == ADDITIONAL_NEW_ORGANIZATION;
    }
}
