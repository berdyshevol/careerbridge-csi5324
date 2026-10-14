
package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.service.JobPostingService;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/postings")
public class AdminJobPostingController {

    private final JobPostingService jobPostingService;

    public AdminJobPostingController(JobPostingService jobPostingService) {
        this.jobPostingService = jobPostingService;
    }

    // UC-12: Administrator reviews pending job postings
    @GetMapping("/pending")
    public List<JobPosting> getPendingPostings() {
        return jobPostingService.getPendingPostings();
    }

    // UC-12: Approve a posting and make it visible to applicants
    @PostMapping("/{postingId}/approve")
    public JobPosting approvePosting(
            @PathVariable Long postingId,
            @RequestBody(required = false) ReviewRequest request,
            Authentication authentication) {

        return jobPostingService.approvePosting(
                postingId,
                authentication.getName(),
                request == null ? null : request.comment());
    }

    // UC-12: Return a posting to the recruiter for corrections
    @PostMapping("/{postingId}/return")
    public JobPosting returnPosting(
            @PathVariable Long postingId,
            @RequestBody ReviewRequest request,
            Authentication authentication) {

        return jobPostingService.returnPosting(
                postingId,
                authentication.getName(),
                request.comment());
    }

    // UC-12: Reject a posting
    @PostMapping("/{postingId}/reject")
    public JobPosting rejectPosting(
            @PathVariable Long postingId,
            @RequestBody ReviewRequest request,
            Authentication authentication) {

        return jobPostingService.rejectPosting(
                postingId,
                authentication.getName(),
                request.comment());
    }

    // Convert invalid requests into readable HTTP responses
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public String handleInvalidRequest(IllegalArgumentException ex) {
        return ex.getMessage();
    }

    @ExceptionHandler(IllegalStateException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public String handleInvalidState(IllegalStateException ex) {
        return ex.getMessage();
    }

    public record ReviewRequest(String comment) {
    }
}
