package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.repository.ApplicantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// UC-03, SD-9 and SD-10: the email is the token's subject, so an applicant only reaches their own profile (BR-15)
@Service
@Transactional
public class ApplicantProfileService {

    private final ApplicantRepository applicantRepository;

    public ApplicantProfileService(ApplicantRepository applicantRepository) {
        this.applicantRepository = applicantRepository;
    }

    @Transactional(readOnly = true)
    public Applicant viewProfile(String email) {
        return applicantRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new AccountGoneException(email));
    }
}
