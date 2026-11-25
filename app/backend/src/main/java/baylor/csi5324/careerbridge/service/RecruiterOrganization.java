package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Optional;

// STAND-IN: SCRUM-198 replaces this with the recruiter's Active OrganizationMembership (BR-14, A16),
// which UC-09 owns. Until then one configured organization stands for every recruiter. Fails closed:
// with no name set, or one that matches nothing, the recruiter acts for no organization.
@Component
public class RecruiterOrganization {

    private final OrganizationRepository organizationRepository;
    private final String organizationName;

    public RecruiterOrganization(OrganizationRepository organizationRepository,
                                 @Value("${careerbridge.standin.recruiter-organization:}") String organizationName) {
        this.organizationRepository = organizationRepository;
        this.organizationName = organizationName.trim();
    }

    // The email is unused here but is what the membership lookup will need
    public Optional<Organization> activeOrganizationOf(String recruiterEmail) {
        return organizationName.isEmpty() ? Optional.empty() : organizationRepository.findByName(organizationName);
    }
}
