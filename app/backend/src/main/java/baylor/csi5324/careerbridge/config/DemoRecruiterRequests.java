package baylor.csi5324.careerbridge.config;

import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.MembershipRequestType;
import baylor.csi5324.careerbridge.model.MembershipStatus;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.OrganizationMembership;
import baylor.csi5324.careerbridge.model.OrganizationStatus;
import baylor.csi5324.careerbridge.model.Recruiter;
import baylor.csi5324.careerbridge.repository.OrganizationMembershipRepository;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import baylor.csi5324.careerbridge.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.List;

// Recruiter requests waiting for the administrator (UC-10), so the queue is never empty in a demo. Added on
// every start while the email is unused; once the administrator decides, the request is left as it is.
// They have no password: these people only need to be in the queue, not to log in (SCRUM-233)
@Component
@Order(4) // after DemoPostings, so Pixel Labs exists to be joined
public class DemoRecruiterRequests implements CommandLineRunner {

    record DemoRequest(String firstName, String lastName, String email, String jobTitle, String organization,
                       boolean newOrganization) {
    }

    static final List<DemoRequest> REQUESTS = List.of(
            new DemoRequest("Taylor", "Brooks", "taylor.brooks@example.com", "Hiring Manager",
                    "Bright Path Tutoring", true),
            new DemoRequest("Morgan", "Diaz", "morgan.diaz@example.com", "Technical Recruiter", "Pixel Labs", false));

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationMembershipRepository membershipRepository;
    private final Clock clock;
    private final boolean enabled;

    public DemoRecruiterRequests(UserRepository userRepository, OrganizationRepository organizationRepository,
                                 OrganizationMembershipRepository membershipRepository, Clock clock,
                                 @Value("${careerbridge.demo.postings:true}") boolean enabled) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.membershipRepository = membershipRepository;
        this.clock = clock;
        this.enabled = enabled;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!enabled) {
            return;
        }
        for (DemoRequest request : REQUESTS) {
            if (userRepository.findByEmailIgnoreCase(request.email()).isPresent()) {
                continue;
            }
            Organization organization = organizationRepository.findByName(request.organization())
                    .orElseGet(() -> request.newOrganization() ? newOrganization(request.organization()) : null);
            if (organization == null) {
                continue;
            }
            Recruiter recruiter = new Recruiter();
            recruiter.setFirstName(request.firstName());
            recruiter.setLastName(request.lastName());
            recruiter.setEmail(request.email());
            recruiter.setJobTitle(request.jobTitle());
            recruiter.setAccountStatus(AccountStatus.PENDING_APPROVAL);
            recruiter.setEmailVerified(true);
            userRepository.save(recruiter);
            membershipRepository.save(new OrganizationMembership(recruiter, organization, MembershipStatus.PENDING,
                    request.newOrganization() ? MembershipRequestType.NEW_RECRUITER_NEW_ORGANIZATION
                            : MembershipRequestType.NEW_RECRUITER_EXISTING_ORGANIZATION,
                    clock.instant()));
        }
    }

    private Organization newOrganization(String name) {
        Organization organization = new Organization(name);
        organization.setOrganizationStatus(OrganizationStatus.PENDING_APPROVAL);
        return organizationRepository.save(organization);
    }
}
