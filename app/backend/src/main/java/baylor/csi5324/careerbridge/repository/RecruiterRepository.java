package baylor.csi5324.careerbridge.repository;

import baylor.csi5324.careerbridge.model.Recruiter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RecruiterRepository extends JpaRepository<Recruiter, Long> {

    Optional<Recruiter> findByEmailIgnoreCase(String email);
}
