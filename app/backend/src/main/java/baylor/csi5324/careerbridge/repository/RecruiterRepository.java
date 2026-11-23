package baylor.csi5324.careerbridge.repository;

import baylor.csi5324.careerbridge.model.Recruiter;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RecruiterRepository extends JpaRepository<Recruiter, Long> {

    Optional<Recruiter> findByEmailIgnoreCase(String email);

    Optional<Recruiter> findByVerificationTokenHash(String verificationTokenHash);

    // UC-09 extension 6b: two requests from one recruiter at once are checked one after the other
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Recruiter r where lower(r.email) = lower(:email)")
    Optional<Recruiter> lockByEmail(String email);
}
