package baylor.csi5324.careerbridge.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.ZoneId;
import java.time.ZoneOffset;

@Entity
@Table(name = "organizations")
public class Organization {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long organizationId;

    @Column(nullable = false, unique = true)
    private String name;

    // Null for an organization loaded before statuses existed: those were all registered
    @Enumerated(EnumType.STRING)
    private OrganizationStatus organizationStatus;
    private String website;
    private String description;
    // UC-08 step 3
    private String industry;
    private String headquarters;
    @Column(name = "organization_size")
    private String size;

    // An organization with no recorded zone counts its deadlines in UTC
    @Column(length = 100)
    private String timeZone = "UTC";

    public Organization() {
    }

    public Organization(String name) {
        this.name = name;
    }

    public Long getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(Long organizationId) {
        this.organizationId = organizationId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public OrganizationStatus getOrganizationStatus() {
        return organizationStatus;
    }

    public void setOrganizationStatus(OrganizationStatus organizationStatus) {
        this.organizationStatus = organizationStatus;
    }

    // Approved by an Administrator (UC-10), so recruiters may find and join it (UC-08 4c, UC-09)
    public boolean isRegistered() {
        return organizationStatus == null || organizationStatus == OrganizationStatus.ACTIVE;
    }

    public String getIndustry() {
        return industry;
    }

    public void setIndustry(String industry) {
        this.industry = industry;
    }

    public String getHeadquarters() {
        return headquarters;
    }

    public void setHeadquarters(String headquarters) {
        this.headquarters = headquarters;
    }

    public String getSize() {
        return size;
    }

    public void setSize(String size) {
        this.size = size;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getTimeZone() {
        return timeZone;
    }

    public void setTimeZone(String timeZone) {
        this.timeZone = ZoneId.of(timeZone.trim()).getId();
    }

    public ZoneId getZoneId() {
        return timeZone == null ? ZoneOffset.UTC : ZoneId.of(timeZone);
    }
}
