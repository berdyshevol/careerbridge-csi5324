package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.controller.dto.ApplicationResponse;
import baylor.csi5324.careerbridge.controller.dto.SubmitApplicationRequest;
import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ResumeSnapshot;
import baylor.csi5324.careerbridge.service.ApplicationService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @PostMapping("/postings/{postingId}/apply")
    @ResponseStatus(HttpStatus.CREATED)
    public ApplicationResponse submitApplication(
            @PathVariable Long postingId,
            @RequestBody(required = false) SubmitApplicationRequest request) {

        Long applicantId = request != null ? request.getApplicantId() : null;
        ResumeSnapshot snapshot = null;
        if (request != null && request.getResumeFileName() != null) {
            snapshot = new ResumeSnapshot(
                    request.getResumeFileName(),
                    request.getResumeFileType() != null ? request.getResumeFileType() : "application/pdf",
                    request.getResumeFileSize() != null ? request.getResumeFileSize() : 1024L
            );
        }

        Application application = applicationService.submitApplication(postingId, applicantId, snapshot);
        long activeCount = applicationService.getActiveApplicationCount(applicantId);

        return toResponse(application, activeCount);
    }

    @GetMapping("/postings/{postingId}/applied")
    public Map<String, Object> checkApplied(
            @PathVariable Long postingId,
            @RequestParam(required = false) Long applicantId) {
        boolean applied = applicationService.hasApplied(postingId, applicantId);
        return Map.of("applied", applied);
    }

    @GetMapping("/applications/active-count")
    public Map<String, Object> getActiveCount(@RequestParam(required = false) Long applicantId) {
        long count = applicationService.getActiveApplicationCount(applicantId);
        return Map.of(
                "activeCount", count,
                "limit", ApplicationService.APPLICATION_LIMIT
        );
    }

    @GetMapping("/applications")
    public List<ApplicationResponse> listApplications(@RequestParam(required = false) Long applicantId) {
        List<Application> applications = applicationService.getApplicationsByApplicant(applicantId);
        long activeCount = applicationService.getActiveApplicationCount(applicantId);
        return applications.stream()
                .map(app -> toResponse(app, activeCount))
                .toList();
    }

    private ApplicationResponse toResponse(Application application, long activeCount) {
        return new ApplicationResponse(
                application.getApplicationId(),
                application.getJobPosting().getJobPostId(),
                application.getJobPosting().getTitle(),
                application.getJobPosting().getOrganization().getName(),
                application.getDateApplied(),
                application.getApplicationStatus(),
                application.getResumeSnapshot() != null ? application.getResumeSnapshot().getFileName() : null,
                activeCount
        );
    }
}
