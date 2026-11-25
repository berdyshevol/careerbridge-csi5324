package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.OrganizationStatus;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;

import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.regex.Pattern;

// UC-08 step 4 and technology variation 4a: the organization's details and how a duplicate is found
final class OrganizationRules {

    private static final Pattern NOT_LETTER_OR_DIGIT = Pattern.compile("[^\\p{L}\\p{N}]+");
    // "Waco Freight Co." and "Waco Freight Company, Inc" are one organization
    private static final List<String> LEGAL_SUFFIXES = List.of(
            "incorporated", "inc", "corporation", "corp", "company", "co", "llc", "ltd", "limited", "llp", "lp", "plc");
    private static final Pattern DOMAIN = Pattern.compile("^[a-z0-9-]+(\\.[a-z0-9-]+)+$");
    static final String DOMAIN_MISMATCH = "Work email domain does not match the organization's website";
    private static final int MAX_DESCRIPTION_LENGTH = 255; // the column length

    private OrganizationRules() {
    }

    // The fields are named organization.<field>, so the form puts each reason next to its field
    static Organization newOrganization(OrganizationData data, Map<String, String> errors) {
        OrganizationData given = data == null ? new OrganizationData(null, null, null, null, null, null) : data;
        Organization organization = new Organization();
        organization.setName(AccountRules.required(given.name(), "organization.name", "Legal name",
                AccountRules.MAX_FIELD_LENGTH, errors));
        String website = AccountRules.required(given.website(), "organization.website", "Website",
                AccountRules.MAX_FIELD_LENGTH, errors);
        if (website != null && websiteDomain(website) == null) {
            errors.put("organization.website", "Enter a website like example.com.");
        }
        organization.setWebsite(website);
        organization.setIndustry(AccountRules.limited(given.industry(), "organization.industry", "Industry",
                AccountRules.MAX_FIELD_LENGTH, errors));
        organization.setHeadquarters(AccountRules.limited(given.headquarters(), "organization.headquarters",
                "Headquarters", AccountRules.MAX_FIELD_LENGTH, errors));
        organization.setSize(AccountRules.limited(given.size(), "organization.size", "Size",
                AccountRules.MAX_FIELD_LENGTH, errors));
        organization.setDescription(AccountRules.limited(given.description(), "organization.description",
                "Short description", MAX_DESCRIPTION_LENGTH, errors));
        organization.setOrganizationStatus(OrganizationStatus.PENDING_APPROVAL);
        return organization;
    }

    // The registered organization the new one duplicates (UC-08 4c, UC-10 5c), by normalized legal name or website domain
    static Optional<Organization> registeredDuplicate(Organization candidate, Collection<Organization> organizations) {
        String name = normalizedName(candidate.getName());
        String domain = websiteDomain(candidate.getWebsite());
        return organizations.stream()
                .filter(Organization::isRegistered)
                .filter(other -> !Objects.equals(other.getOrganizationId(), candidate.getOrganizationId()))
                .filter(other -> name.equals(normalizedName(other.getName()))
                        || domain != null && domain.equals(websiteDomain(other.getWebsite())))
                .findFirst();
    }

    // UC-08 extension 4c, UC-09 extension 3a: a new organization must not be one already known
    static void rejectDuplicate(Organization organization, OrganizationRepository organizations) {
        Optional<Organization> duplicate = registeredDuplicate(organization, organizations.findAll());
        if (duplicate.isPresent()) {
            throw new OrganizationAlreadyRegisteredException(duplicate.get());
        }
        // One not registered yet still holds its name: the column is unique
        if (organizations.findByName(organization.getName()).isPresent()) {
            throw new RegistrationRefusedException(Map.of("organization.name",
                    "An organization with this name is already waiting for approval."));
        }
    }

    static String normalizedName(String name) {
        if (name == null) {
            return "";
        }
        List<String> words = List.of(NOT_LETTER_OR_DIGIT.split(name.toLowerCase(Locale.ROOT).strip()));
        int end = words.size();
        while (end > 1 && LEGAL_SUFFIXES.contains(words.get(end - 1))) {
            end--;
        }
        return String.join(" ", words.subList(0, end)).strip();
    }

    // "https://www.Example.com/about" -> "example.com"; null when it is not a website
    static String websiteDomain(String website) {
        if (website == null || website.isBlank()) {
            return null;
        }
        String host = website.strip().toLowerCase(Locale.ROOT).replaceFirst("^[a-z][a-z0-9+.-]*://", "");
        host = host.split("[/?#]", 2)[0].replaceFirst(":\\d+$", "").replaceFirst("^www\\.", "");
        return DOMAIN.matcher(host).matches() ? host : null;
    }

    // A17: the work email should come from the organization's own domain or one of its subdomains
    static String reviewFlag(String email, Organization organization) {
        String domain = websiteDomain(organization.getWebsite());
        String emailDomain = email.substring(email.lastIndexOf('@') + 1);
        boolean matches = domain != null && (emailDomain.equals(domain) || emailDomain.endsWith("." + domain));
        return matches ? null : DOMAIN_MISMATCH;
    }
}
