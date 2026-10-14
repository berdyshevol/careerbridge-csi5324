
package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.dto.CreateJobPostingRequest;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.service.JobPostingService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/postings")
public class JobPostingController {

    private final JobPostingService jobPostingService;

    public JobPostingController(JobPostingService jobPostingService) {
        this.jobPostingService = jobPostingService;
    }

    // UC-01: Browse published job postings
    @GetMapping
    public List<JobPosting> searchPostings(
            @RequestParam(required = false) String keyword) {
        return jobPostingService.searchPostings(keyword);
    }

    // UC-01: View job posting details
    @GetMapping("/{postingId}")
    public JobPosting viewPosting(@PathVariable Long postingId) {
        return jobPostingService.viewPosting(postingId);
    }

    // UC-11: Create a new job posting as a draft
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public JobPosting createPosting(
            @RequestBody CreateJobPostingRequest request) {
        return jobPostingService.createPosting(request);
    }

    // UC-12: Submit a draft posting for administrator approval
    @PostMapping("/{postingId}/submit")
    public JobPosting submitForApproval(@PathVariable Long postingId) {
        return jobPostingService.submitForApproval(postingId);
    }

    // Invalid posting information
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public String handleInvalidRequest(IllegalArgumentException ex) {
        return ex.getMessage();
    }

    // Invalid status transitions
    @ExceptionHandler(IllegalStateException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public String handleInvalidState(IllegalStateException ex) {
        return ex.getMessage();
    }
}
