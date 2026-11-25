package baylor.csi5324.careerbridge.config;

import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.OrganizationMembership;
import baylor.csi5324.careerbridge.model.Resume;
import baylor.csi5324.careerbridge.repository.ApplicantRepository;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import baylor.csi5324.careerbridge.repository.OrganizationMembershipRepository;
import baylor.csi5324.careerbridge.repository.RecruiterRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
class SampleDataLoaderTest {

    @Autowired
    private SampleDataLoader sampleDataLoader;

    @Autowired
    private ApplicantRepository applicantRepository;

    @Autowired
    private JobPostingRepository jobPostingRepository;

    @Autowired
    private RecruiterRepository recruiterRepository;

    @Autowired
    private OrganizationMembershipRepository membershipRepository;

    @Test
    void theDemoApplicantStartsWithAPdfResumeOnFile() {
        Resume resume = jordan().getResume();

        assertEquals("Jordan_Lee_Resume.pdf", resume.getFileName());
        assertEquals("application/pdf", resume.getFileType());
        assertEquals(resume.getContent().length, resume.getFileSize());
        assertTrue(new String(resume.getContent(), StandardCharsets.ISO_8859_1).startsWith("%PDF"));
    }

    @Test
    void aDatabaseLoadedBeforeResumesExistedGivesTheDemoApplicantOne() throws Exception {
        Applicant jordan = jordan();
        jordan.setResume(null);
        applicantRepository.saveAndFlush(jordan);

        sampleDataLoader.run();

        assertEquals("Jordan_Lee_Resume.pdf", jordan().getResume().getFileName());
    }

    @Test
    void aSamplePostingThatNamesItsRecruiterWasCreatedByThem() {
        JobPosting posting = jobPostingRepository.findAll().stream()
                .filter(p -> p.getTitle().equals("Robotics Software Engineer"))
                .findFirst().orElseThrow();

        assertEquals("Lone Star Robotics", posting.getOrganization().getName());
        assertTrue(posting.wasCreatedBy("recruiter4@example.com"));
        // And they belong to that organization only, so they may close it (DemoUsers)
        var recruiter = recruiterRepository.findByEmailIgnoreCase("recruiter4@example.com").orElseThrow();
        assertEquals(java.util.List.of("Lone Star Robotics"),
                membershipRepository.findByRecruiterOrderByRequestedAtAscMembershipIdAsc(recruiter).stream()
                        .map(OrganizationMembership::getOrganization).map(o -> o.getName()).toList());
    }

    private Applicant jordan() {
        return applicantRepository.findByEmailIgnoreCase(SampleDataLoader.SAMPLE_APPLICANT_EMAIL).orElseThrow();
    }
}
