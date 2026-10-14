
package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.dto.CreateJobPostingRequest;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.PostStatus;
import baylor.csi5324.careerbridge.repository.JobPostingRepository;
import baylor.csi5324.careerbridge.repository.OrganizationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

@Service
public class JobPostingService {

    private final JobPostingRepository jobPostingRepository;
    private final OrganizationRepository organizationRepository;

    public JobPostingService(
            JobPostingRepository jobPostingRepository,
            OrganizationRepository organizationRepository) {
        this.jobPostingRepository = jobPostingRepository;
        this.organizationRepository = organizationRepository;
    }

    public List<JobPosting> searchPostings(String keyword) {
        List<JobPosting> openPostings = jobPostingRepository
                .findByPostStatusAndApplicationDeadlineGreaterThanEqualOrderByDatePostedDesc(
                        PostStatus.PUBLISHED, LocalDate.now());

        if (keyword == null || keyword.isBlank()) {
            return openPostings;
        }

        String needle = keyword.trim().toLowerCase(Locale.ROOT);

        return openPostings.stream()
                .filter(posting -> contains(posting.getTitle(), needle)
                        || contains(posting.getOrganization().getName(), needle)
                        || contains(posting.getLocation(), needle))
                .toList();
    }

    public JobPosting viewPosting(Long postingId) {
        return jobPostingRepository.findById(postingId)
                .filter(JobPosting::wasPublished)
                .orElseThrow(() -> new PostingNotFoundException(postingId));
    }

    public JobPosting createPosting(CreateJobPostingRequest request) {

        if (request == null) {
            throw new InvalidPostingException("Posting details are required");
        }

        if (request.organizationId() == null) {
            throw new InvalidPostingException("Organization is required");
        }

        Organization organization = organizationRepository
                .findById(request.organizationId())
                .orElseThrow(() ->
                        new InvalidPostingException("Organization not found"));

        if (request.title() == null || request.title().isBlank()) {
            throw new InvalidPostingException("Job title is required");
        }

        if (request.title().trim().length() > 255) {
            throw new InvalidPostingException("Job title is too long");
        }

        if (request.description() != null
                && request.description().length() > 10000) {
            throw new InvalidPostingException("Description is too long");
        }

        if (request.jobRequirements() != null
                && request.jobRequirements().length() > 2000) {
            throw new InvalidPostingException("Job requirements are too long");
        }

        requireShortText(request.location(), "Location");
        requireShortText(request.employmentType(), "Employment type");
        requireShortText(request.salaryRange(), "Salary range");

        if (request.applicationDeadline() == null
                || request.applicationDeadline().isBefore(LocalDate.now())) {
            throw new InvalidPostingException(
                    "Application deadline must be today or later");
        }

        if (request.numberOfOpenings() < 1) {
            throw new InvalidPostingException(
                    "At least one opening is required");
        }

        JobPosting posting = new JobPosting();

        posting.setOrganization(organization);
        posting.setTitle(request.title().trim());
        posting.setDescription(request.description());
        posting.setJobRequirements(request.jobRequirements());
        posting.setLocation(request.location());
        posting.setEmploymentType(request.employmentType());
        posting.setSalaryRange(request.salaryRange());
        posting.setNumberOfOpenings(request.numberOfOpenings());
        posting.setApplicationDeadline(request.applicationDeadline());

        // UC-12 will handle approval and publication later
        posting.setPostStatus(PostStatus.DRAFT);

        posting.setDatePosted(LocalDate.now());

        return jobPostingRepository.save(posting);
    }

    // Longer text does not fit its column, and the database would answer with a server error
    private static void requireShortText(String text, String fieldName) {
        if (text != null && text.length() > 255) {
            throw new InvalidPostingException(fieldName + " is too long");
        }
    }

    private static boolean contains(String text, String needle) {
        return text != null && text.toLowerCase(Locale.ROOT).contains(needle);
    }
}

