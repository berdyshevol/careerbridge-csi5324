package baylor.csi5324.careerbridge.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.Table;

import java.time.Duration;
import java.time.Instant;

@Entity
// "user" is a reserved word in H2
@Table(name = "users")
// Joined, not single-table: the discriminator check constraint Hibernate generates is rejected by H2
@Inheritance(strategy = InheritanceType.JOINED)
public class User {

    // A15: five failed log-ins within 15 minutes lock the account for 15 minutes
    private static final int FAILED_LOG_INS_BEFORE_LOCK = 5;
    private static final Duration FAILED_LOG_IN_WINDOW = Duration.ofMinutes(15);
    private static final Duration LOCK_DURATION = Duration.ofMinutes(15);

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long userId;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    // The email identifies the person at registration, so two accounts must not share one
    @Column(nullable = false, unique = true)
    private String email;

    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountStatus accountStatus;

    // NFR-UC02.1: only a salted hash is kept. Null for an account that cannot log in yet.
    private String passwordHash;

    // Nullable so that the columns can be added to a table that already has rows
    private Integer failedLogIns;
    private Instant firstFailedLogInAt;
    private Instant lockedUntil;

    public User() {
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public AccountStatus getAccountStatus() {
        return accountStatus;
    }

    public void setAccountStatus(AccountStatus accountStatus) {
        this.accountStatus = accountStatus;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public Instant getLockedUntil() {
        return lockedUntil;
    }

    public boolean isLockedAt(Instant now) {
        return lockedUntil != null && now.isBefore(lockedUntil);
    }

    public void recordFailedLogIn(Instant now) {
        if (firstFailedLogInAt == null || !now.isBefore(firstFailedLogInAt.plus(FAILED_LOG_IN_WINDOW))) {
            firstFailedLogInAt = now;
            failedLogIns = 0;
        }
        failedLogIns = (failedLogIns == null ? 0 : failedLogIns) + 1;
        if (failedLogIns >= FAILED_LOG_INS_BEFORE_LOCK) {
            lockedUntil = now.plus(LOCK_DURATION);
            firstFailedLogInAt = null;
            failedLogIns = 0;
        }
    }

    public void recordLogIn() {
        firstFailedLogInAt = null;
        failedLogIns = 0;
        lockedUntil = null;
    }
}
