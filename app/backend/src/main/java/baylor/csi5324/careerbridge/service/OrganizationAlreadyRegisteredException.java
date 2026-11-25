package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.Organization;

// UC-08 extension 4c: the visitor may ask to join this organization instead
public class OrganizationAlreadyRegisteredException extends RuntimeException {

    private final Organization organization;

    public OrganizationAlreadyRegisteredException(Organization organization) {
        super("This organization is already registered. Ask to join " + organization.getName() + " instead?");
        this.organization = organization;
    }

    public Organization getOrganization() {
        return organization;
    }
}
