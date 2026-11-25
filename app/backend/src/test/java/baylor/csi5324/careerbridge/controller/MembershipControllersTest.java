package baylor.csi5324.careerbridge.controller;

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
import baylor.csi5324.careerbridge.service.MembershipFixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.hamcrest.Matchers.startsWith;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// UC-08, UC-09 and UC-10 over HTTP: who reaches what, and the bodies of the refusals
@SpringBootTest
class MembershipControllersTest {

    private static final String ADMINISTRATOR = "admin@careerbridge.example";

    @Autowired
    private WebApplicationContext context;
    @Autowired
    private RecruiterRepository recruiterRepository;
    @Autowired
    private OrganizationRepository organizationRepository;
    @Autowired
    private OrganizationMembershipRepository membershipRepository;

    private MockMvc mockMvc;
    private MembershipFixtures fixtures;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        fixtures = new MembershipFixtures(recruiterRepository, organizationRepository, membershipRepository);
    }

    private static RequestPostProcessor as(String email, String role) {
        return jwt().jwt(token -> token.subject(email)).authorities(new SimpleGrantedAuthority("ROLE_" + role));
    }

    private static String registration(long n, String organization) {
        return """
                {"fullName": "Lee Huang", "jobTitle": "HR manager", "email": "lee.%d@freight%d.example",
                 "password": "Sunrise-2026x", %s}""".formatted(n, n, organization);
    }

    @Test
    void aVisitorRegistersARecruiterAndGetsTheVerificationLinkOnTheTestDatabase() throws Exception {
        long n = System.nanoTime();
        mockMvc.perform(post("/api/recruiters").contentType(MediaType.APPLICATION_JSON)
                        .content(registration(n, """
                                "organization": {"name": "Freight %d", "website": "freight%d.example"}""".formatted(n, n))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.organizationName").value("Freight " + n))
                .andExpect(jsonPath("$.joinsExistingOrganization").value(false))
                .andExpect(jsonPath("$.verificationLink").value(startsWith("/recruiter/verify?token=")));
    }

    @Test
    void aRegisteredOrganizationComesBackSoTheVisitorCanAskToJoinIt() throws Exception {
        long n = System.nanoTime();
        Organization registered = fixtures.organization("Freight " + n + " Inc", "freight" + n + ".example",
                OrganizationStatus.ACTIVE);
        mockMvc.perform(post("/api/recruiters").contentType(MediaType.APPLICATION_JSON)
                        .content(registration(n, """
                                "organization": {"name": "Freight %d", "website": "elsewhere%d.example"}""".formatted(n, n))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.reason").value("ORGANIZATION_REGISTERED"))
                .andExpect(jsonPath("$.organization.organizationId").value(registered.getOrganizationId()))
                .andExpect(jsonPath("$.organization.organizationStatus").doesNotExist());
        mockMvc.perform(post("/api/recruiters").contentType(MediaType.APPLICATION_JSON)
                        .content(registration(n, "\"joinOrganizationId\": " + registered.getOrganizationId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.joinsExistingOrganization").value(true));
    }

    @Test
    void invalidFieldsComeBackFieldByFieldAndABadLinkIsNotFound() throws Exception {
        mockMvc.perform(post("/api/recruiters").contentType(MediaType.APPLICATION_JSON).content("{\"organization\": {}}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$['organization.website']").value("Website is required."))
                .andExpect(jsonPath("$.jobTitle").value("Job title is required."));
        mockMvc.perform(post("/api/recruiters/verification").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\": \"never-sent\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.expired").value(false));
    }

    @Test
    void searchingOrganizationsNeedsNoRole() throws Exception {
        Organization registered = fixtures.registeredOrganization();
        mockMvc.perform(get("/api/organizations").param("query", registered.getName()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value(registered.getName()));
    }

    @Test
    void onlyARecruiterReachesTheirMemberships() throws Exception {
        mockMvc.perform(get("/api/recruiter/memberships")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/recruiter/memberships").with(as("jordan.lee@example.com", "APPLICANT")))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/recruiter/memberships").with(as("riley.chen@example.com", "RECRUITER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));
    }

    @Test
    void aSecondRequestIsAConflictCarryingTheExistingStatus() throws Exception {
        Recruiter recruiter = fixtures.approvedRecruiter();
        Organization target = fixtures.registeredOrganization();
        String body = "{\"organizationId\": " + target.getOrganizationId()
                + ", \"role\": \"Recruiter\", \"justification\": \"Shared team.\"}";

        mockMvc.perform(post("/api/recruiter/memberships").with(as(recruiter.getEmail(), "RECRUITER"))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"));
        mockMvc.perform(post("/api/recruiter/memberships").with(as(recruiter.getEmail(), "RECRUITER"))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.message").value("You already asked to join " + target.getName() + ". Status: Pending."));
    }

    @Test
    void onlyTheAdministratorReachesTheQueueAndADecidedRequestIsAConflict() throws Exception {
        OrganizationMembership request = fixtures.membership(fixtures.recruiter(AccountStatus.PENDING_APPROVAL),
                fixtures.registeredOrganization(), MembershipStatus.PENDING,
                MembershipRequestType.NEW_RECRUITER_EXISTING_ORGANIZATION);
        String approve = "/api/admin/requests/" + request.getMembershipId() + "/approve";

        mockMvc.perform(get("/api/admin/requests")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/admin/requests").with(as("riley.chen@example.com", "RECRUITER")))
                .andExpect(status().isForbidden());
        mockMvc.perform(post(approve).with(as("riley.chen@example.com", "RECRUITER"))).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/requests/" + request.getMembershipId()).with(as(ADMINISTRATOR, "ADMINISTRATOR")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requester.jobTitle").value("Talent lead"))
                .andExpect(jsonPath("$.requestTypeLabel").value("New recruiter, existing organization"));

        mockMvc.perform(post(approve).with(as(ADMINISTRATOR, "ADMINISTRATOR")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
        mockMvc.perform(post(approve).with(as(ADMINISTRATOR, "ADMINISTRATOR")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.message").value("This request is now Approved. Nothing was changed."));
        mockMvc.perform(post("/api/admin/requests/" + request.getMembershipId() + "/deny")
                        .with(as(ADMINISTRATOR, "ADMINISTRATOR"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"note\": \" \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.reason").value("A reason is required."));
    }
}
