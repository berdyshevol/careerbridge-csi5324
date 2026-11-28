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

// Job offer linked 0..1 to an Application (UC-07, UC-15, A14). Part of the Application aggregate:
// its changes are package-private and made only through the Application's own operations
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

    protected Offer() {
    }

    Offer(Application application, LocalDate dateExtended, OfferTerms offerTerms) {
        this.application = application;
        this.dateExtended = dateExtended;
        applyTerms(offerTerms);
    }

    // Response deadline holds through the end of expirationDate in the organization's time zone (A14)
    public boolean isExpired(Instant now, ZoneId zoneId) {
        return LocalDate.ofInstant(now, zoneId).isAfter(expirationDate);
    }

    public boolean canRespond(Instant now, ZoneId zoneId) {
        return isOpen() && !isExpired(now, zoneId);
    }

    public boolean isOpen() {
        return status == OfferStatus.PENDING;
    }

    // The applicant answers the terms they saw; a revision since then is refused (FR-UC07.11, ext 6b)
    void requireRevision(int expectedRevision, Instant now, ZoneId zoneId) {
        if (expectedRevision != revision) {
            throw new OfferRevisedException(this, now, zoneId);
        }
    }

    void accept(LocalDate on) {
        respond(OfferStatus.ACCEPTED, on);
    }

    void decline(LocalDate on) {
        respond(OfferStatus.DECLINED, on);
    }

    // CO-14.3 at the Offer stage, and Close Job Posting (A3): the applicant never answered
    void rescind() {
        moveTo(OfferStatus.RESCINDED);
    }

    void revise(OfferTerms offerTerms) {
        if (!isOpen()) {
            throw new IllegalStateException("Only an open offer is revised; this one is " + status);
        }
        applyTerms(offerTerms);
        revision++;
    }

    private void respond(OfferStatus answer, LocalDate on) {
        moveTo(answer);
        responseDate = on;
    }

    private void moveTo(OfferStatus next) {
        if (!status.canMoveTo(next)) {
            throw new IllegalStateException("An offer that is " + status + " cannot become " + next);
        }
        status = next;
    }

    private void applyTerms(OfferTerms offerTerms) {
        startDate = offerTerms.startDate();
        salary = offerTerms.salary();
        terms = offerTerms.terms();
        expirationDate = offerTerms.expirationDate();
        offerLetterFileName = offerTerms.offerLetterFileName();
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

    public LocalDate getResponseDate() {
        return responseDate;
    }

    public int getRevision() {
        return revision;
    }
}
