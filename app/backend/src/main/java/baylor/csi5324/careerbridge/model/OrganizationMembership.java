package baylor.csi5324.careerbridge.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

// A recruiter's link to one organization, and the request for it that the Administrator decides
// (UC-08, UC-09, UC-10). Kept after a decision, so the decision stays on record (NFR-UC10.1).
@Entity
@Table(name = "organization_memberships")
public class OrganizationMembership {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long membershipId;

    @ManyToOne(optional = false)
    @JoinColumn(name = "recruiter_id")
    private Recruiter recruiter;

    @ManyToOne(optional = false)
    @JoinColumn(name = "organization_id")
    private Organization organization;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MembershipStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MembershipRequestType requestType;

    @Column(nullable = false)
    private Instant requestedAt;
    private Instant approvedAt;

    // CO-09.1: the recruiter's role at the organization and why they recruit for it
    private String role;
    @Column(length = 2000)
    private String justification;

    // UC-08 extension 4d (A17): why the Administrator should look closer
    private String reviewFlag;

    // UC-10: who decided and when; for a denial its reason, for 5b the question asked
    private String decidedBy;
    private Instant decidedAt;
    @Column(length = 2000)
    private String decisionNote;

    protected OrganizationMembership() {
    }

    public OrganizationMembership(Recruiter recruiter, Organization organization, MembershipStatus status,
                                  MembershipRequestType requestType, Instant requestedAt) {
        this.recruiter = recruiter;
        this.organization = organization;
        this.status = status;
        this.requestType = requestType;
        this.requestedAt = requestedAt;
    }

    public Long getMembershipId() {
        return membershipId;
    }

    public Recruiter getRecruiter() {
        return recruiter;
    }

    public Organization getOrganization() {
        return organization;
    }

    public void setOrganization(Organization organization) {
        this.organization = organization;
    }

    public MembershipStatus getStatus() {
        return status;
    }

    public void setStatus(MembershipStatus status) {
        this.status = status;
    }

    public MembershipRequestType getRequestType() {
        return requestType;
    }

    public Instant getRequestedAt() {
        return requestedAt;
    }

    public Instant getApprovedAt() {
        return approvedAt;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getJustification() {
        return justification;
    }

    public void setJustification(String justification) {
        this.justification = justification;
    }

    public String getReviewFlag() {
        return reviewFlag;
    }

    public void setReviewFlag(String reviewFlag) {
        this.reviewFlag = reviewFlag;
    }

    public String getDecidedBy() {
        return decidedBy;
    }

    public Instant getDecidedAt() {
        return decidedAt;
    }

    public String getDecisionNote() {
        return decisionNote;
    }

    public void approve(String administrator, Instant now) {
        status = MembershipStatus.ACTIVE;
        approvedAt = now;
        recordDecision(administrator, now, null);
    }

    public void recordDecision(MembershipStatus decision, String administrator, Instant now, String note) {
        status = decision;
        recordDecision(administrator, now, note);
    }

    private void recordDecision(String administrator, Instant now, String note) {
        decidedBy = administrator;
        decidedAt = now;
        decisionNote = note;
    }
}
