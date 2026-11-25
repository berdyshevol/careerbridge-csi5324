package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.repository.ApplicationRepository;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import baylor.csi5324.careerbridge.repository.StageCount;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// UC-14 steps 1-2. A query, so it has no operation contract.
@Service
public class RecruiterPostingsService {

    private final RecruiterOrganization recruiterOrganization;
    private final JobPostingRepository jobPostingRepository;
    private final ApplicationRepository applicationRepository;

    public RecruiterPostingsService(RecruiterOrganization recruiterOrganization,
                                    JobPostingRepository jobPostingRepository,
                                    ApplicationRepository applicationRepository) {
        this.recruiterOrganization = recruiterOrganization;
        this.jobPostingRepository = jobPostingRepository;
        this.applicationRepository = applicationRepository;
    }

    @Transactional(readOnly = true)
    public RecruiterPostings listPostings(String recruiterEmail) {
        Organization organization = recruiterOrganization.activeOrganizationOf(recruiterEmail).orElse(null);
        if (organization == null) {
            return new RecruiterPostings(null, List.of());
        }

        Map<Long, Map<ApplicationStatus, Long>> counts = new HashMap<>();
        for (StageCount count : applicationRepository.countByPostingAndStage(organization, ApplicationStatus.ACTIVE)) {
            counts.computeIfAbsent(count.jobPostId(), id -> noApplications())
                    .put(count.applicationStatus(), count.applications());
        }

        List<RecruiterPostings.RecruiterPosting> postings = jobPostingRepository
                .findByOrganizationOrderByDatePostedDescJobPostIdDesc(organization).stream()
                .map(posting -> new RecruiterPostings.RecruiterPosting(
                        posting, counts.getOrDefault(posting.getJobPostId(), noApplications())))
                .toList();
        return new RecruiterPostings(organization, postings);
    }

    // ACTIVE is an EnumSet, so the stages come in pipeline order
    private static Map<ApplicationStatus, Long> noApplications() {
        Map<ApplicationStatus, Long> counts = new EnumMap<>(ApplicationStatus.class);
        for (ApplicationStatus stage : ApplicationStatus.ACTIVE) {
            counts.put(stage, 0L);
        }
        return counts;
    }
}
