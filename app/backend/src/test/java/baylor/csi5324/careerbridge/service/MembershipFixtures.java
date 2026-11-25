package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.MembershipRequestType;
import baylor.csi5324.careerbridge.model.MembershipStatus;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.OrganizationMembership;
import baylor.csi5324.careerbridge.model.OrganizationStatus;
import baylor.csi5324.careerbridge.model.Recruiter;
import baylor.csi5324.careerbridge.repository.OrganizationMembershipRepository;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import baylor.csi5324.careerbridge.repository.RecruiterRepository;

import java.time.Instant;

// Rows of their own for each test: the tests share one database
public record MembershipFixtures(RecruiterRepository recruiters, OrganizationRepository organizations,
                                 OrganizationMembershipRepository memberships) {

    public static String unique(String text) {
        return text + " " + System.nanoTime();
    }

    public Organization organization(String name, String website, OrganizationStatus status) {
        Organization organization = new Organization(name);
        organization.setWebsite(website);
        organization.setOrganizationStatus(status);
        return organizations.save(organization);
    }

    public Organization registeredOrganization() {
        long n = System.nanoTime();
        return organization("Registered Org " + n, "registered" + n + ".example", OrganizationStatus.ACTIVE);
    }

    public Recruiter recruiter(AccountStatus status) {
        Recruiter recruiter = new Recruiter();
        recruiter.setFirstName("Sam");
        recruiter.setLastName("Ortiz");
        recruiter.setEmail("sam.ortiz." + System.nanoTime() + "@example.com");
        recruiter.setAccountStatus(status);
        recruiter.setJobTitle("Talent lead");
        return recruiters.save(recruiter);
    }

    public OrganizationMembership membership(Recruiter recruiter, Organization organization, MembershipStatus status,
                                             MembershipRequestType type) {
        OrganizationMembership membership = new OrganizationMembership(recruiter, organization, status, type, Instant.now());
        membership.setRole("Recruiter");
        membership.setJustification("I hire for them.");
        return memberships.save(membership);
    }

    // CO-09.1 preconditions: an approved recruiter with one Active membership
    public Recruiter approvedRecruiter() {
        Recruiter recruiter = recruiter(AccountStatus.ACTIVE);
        membership(recruiter, registeredOrganization(), MembershipStatus.ACTIVE,
                MembershipRequestType.NEW_RECRUITER_NEW_ORGANIZATION);
        return recruiter;
    }
}
