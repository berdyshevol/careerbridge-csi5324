package baylor.csi5324.careerbridge.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

// Job offer linked 0..1 to an Application (UC-07, UC-15, A14)
@Entity
@Table(name = "offers")
public class Offer {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long offerId;

    @OneToOne(optional = false)
    @JoinColumn(name = "application_id", nullable = false, unique = true)
    private Application application;

    @Column(nullable = false)
    private LocalDate dateExtended;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false, length = 255)
    private String salary;

    @Column(length = 4000)
    private String terms;

    @Column(nullable = false)
    private LocalDate expirationDate;

    @Column(length = 255)
    private String offerLetterFileName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OfferStatus status = OfferStatus.PENDING;

    private LocalDate responseDate;

    // Incremented when a recruiter revises terms so stale accept/decline requests are caught (FR-UC07.11, ext 6b)
    @Column(nullable = false)
    private int revision = 1;

    public Offer() {
    }

    public Offer(Application application, LocalDate dateExtended, LocalDate startDate, String salary,
                 String terms, LocalDate expirationDate, String offerLetterFileName) {
        this.application = application;
        this.dateExtended = dateExtended;
        this.startDate = startDate;
        this.salary = salary;
        this.terms = terms;
        this.expirationDate = expirationDate;
        this.offerLetterFileName = offerLetterFileName;
    }

    // Response deadline holds through the end of expirationDate in the organization's time zone (A14)
    public boolean isExpired(Instant now, ZoneId zoneId) {
        return LocalDate.ofInstant(now, zoneId).isAfter(expirationDate);
    }

    public boolean canRespond(Instant now, ZoneId zoneId) {
        return status == OfferStatus.PENDING && !isExpired(now, zoneId);
    }

    public Long getOfferId() {
        return offerId;
    }

    public Application getApplication() {
        return application;
    }

    public LocalDate getDateExtended() {
        return dateExtended;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public String getSalary() {
        return salary;
    }

    public String getTerms() {
        return terms;
    }

    public LocalDate getExpirationDate() {
        return expirationDate;
    }

    public String getOfferLetterFileName() {
        return offerLetterFileName;
    }

    public OfferStatus getStatus() {
        return status;
    }

    // Written only by the lifecycle package (LayersTest)
    public void enterStatus(OfferStatus status) {
        this.status = status;
    }

    public void recordResponse(LocalDate responseDate) {
        this.responseDate = responseDate;
    }

    // New terms always bump the revision, so an applicant answering the old terms is caught (ext 6b)
    public void revise(LocalDate startDate, String salary, String terms, LocalDate expirationDate,
                       String offerLetterFileName) {
        this.startDate = startDate;
        this.salary = salary;
        this.terms = terms;
        this.expirationDate = expirationDate;
        this.offerLetterFileName = offerLetterFileName;
        revision++;
    }

    public LocalDate getResponseDate() {
        return responseDate;
    }

    public int getRevision() {
        return revision;
    }
}

