package baylor.csi5324.careerbridge.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;

@Entity
@Table(name = "offers")
public class Offer {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long offerId;

    @Column(nullable = false)
    private LocalDate dateExtended;

    @Column(nullable = false)
    private LocalDate expirationDate;

    private LocalDate startDate;

    @Column(nullable = false)
    private String salary;

    @Column(length = 2000)
    private String terms;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OfferStatus status = OfferStatus.EXTENDED;

    private LocalDate responseDate;

    public Offer() {
    }

    public Offer(LocalDate dateExtended, LocalDate expirationDate, LocalDate startDate,
                 String salary, String terms) {
        this.dateExtended = dateExtended;
        this.expirationDate = expirationDate;
        this.startDate = startDate;
        this.salary = salary;
        this.terms = terms;
        this.status = OfferStatus.EXTENDED;
    }

    public Long getOfferId() {
        return offerId;
    }

    public LocalDate getDateExtended() {
        return dateExtended;
    }

    public void setDateExtended(LocalDate dateExtended) {
        this.dateExtended = dateExtended;
    }

    public LocalDate getExpirationDate() {
        return expirationDate;
    }

    public void setExpirationDate(LocalDate expirationDate) {
        this.expirationDate = expirationDate;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public String getSalary() {
        return salary;
    }

    public void setSalary(String salary) {
        this.salary = salary;
    }

    public String getTerms() {
        return terms;
    }

    public void setTerms(String terms) {
        this.terms = terms;
    }

    public OfferStatus getStatus() {
        return status;
    }

    public void setStatus(OfferStatus status) {
        this.status = status;
    }

    public LocalDate getResponseDate() {
        return responseDate;
    }

    public void setResponseDate(LocalDate responseDate) {
        this.responseDate = responseDate;
    }
}

