package baylor.csi5324.careerbridge.model;

import baylor.csi5324.careerbridge.repository.ApplicantRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import static org.junit.jupiter.api.Assertions.assertEquals;

@DataJpaTest
class ApplicantTest {

    @Autowired
    private ApplicantRepository applicantRepository;

    @Test
    void savesAnApplicantAndReadsItBack() {
        Applicant applicant = new Applicant();
        applicant.setFirstName("Grace");
        applicant.setLastName("Hopper");
        applicant.setEmail("grace@example.com");
        applicant.setAccountStatus(AccountStatus.PENDING_VERIFICATION);

        Long id = applicantRepository.saveAndFlush(applicant).getUserId();

        Applicant reloaded = applicantRepository.findById(id).orElseThrow();
        assertEquals("Grace", reloaded.getFirstName());
        assertEquals("grace@example.com", reloaded.getEmail());
        assertEquals(AccountStatus.PENDING_VERIFICATION, reloaded.getAccountStatus());
    }
}
