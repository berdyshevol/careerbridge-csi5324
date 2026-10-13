
package baylor.csi5324.careerbridge.repository;

import baylor.csi5324.careerbridge.model.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, Long> {
}

