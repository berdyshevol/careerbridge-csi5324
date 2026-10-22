package baylor.csi5324.careerbridge.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

    private String organizationStatus;
    private String website;
    private String description;

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

    public String getOrganizationStatus() {
        return organizationStatus;
    }

    public void setOrganizationStatus(String organizationStatus) {
        this.organizationStatus = organizationStatus;
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
