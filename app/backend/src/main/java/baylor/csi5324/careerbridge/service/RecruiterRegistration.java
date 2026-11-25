package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.OrganizationMembership;

// verificationLink is the path the email holds, given back only where there is no mail service to
// carry it: a demonstration or a test database (careerbridge.demo.verification-links)
public record RecruiterRegistration(OrganizationMembership membership, String verificationLink) {
}
