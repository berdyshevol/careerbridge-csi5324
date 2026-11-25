package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

// STAND-IN: SCRUM-198 replaces this with the recruiter's Active OrganizationMembership (BR-14, A16),
// which UC-09 owns. Until then one configured organization stands for every recruiter, except those
// named in the exceptions, so a test or a demo can show a recruiter of another organization. Fails
// closed: with no name set, or one that matches nothing, the recruiter acts for no organization.
@Component
public class RecruiterOrganization {

    private final OrganizationRepository organizationRepository;
    private final String organizationName;
    private final Map<String, String> exceptions = new HashMap<>();

    public RecruiterOrganization(OrganizationRepository organizationRepository,
                                 @Value("${careerbridge.standin.recruiter-organization:}") String organizationName,
                                 @Value("${careerbridge.standin.recruiter-organization-exceptions:}") String exceptions) {
        this.organizationRepository = organizationRepository;
        this.organizationName = organizationName.trim();
        // "email=Organization name;email=Organization name": organization names may hold commas
        for (String entry : exceptions.split(";")) {
            String[] pair = entry.split("=", 2);
            if (pair.length == 2 && !pair[0].isBlank()) {
                this.exceptions.put(pair[0].trim().toLowerCase(Locale.ROOT), pair[1].trim());
            }
        }
    }

    public Optional<Organization> activeOrganizationOf(String recruiterEmail) {
        String name = recruiterEmail == null
                ? organizationName
                : exceptions.getOrDefault(recruiterEmail.trim().toLowerCase(Locale.ROOT), organizationName);
        return name.isEmpty() ? Optional.empty() : organizationRepository.findByName(name);
    }
}
