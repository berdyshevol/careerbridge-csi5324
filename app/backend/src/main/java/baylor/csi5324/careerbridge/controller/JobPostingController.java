
package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.dto.CreateJobPostingRequest;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.service.InvalidPostingException;
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

    // UC-01: Browse job postings
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

    // UC-11: Create a new job posting
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public JobPosting createPosting(
            @RequestBody CreateJobPostingRequest request) {
        return jobPostingService.createPosting(request);
    }

    // Only this exception: any other failure is the server's, not the recruiter's
    @ExceptionHandler(InvalidPostingException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public String handleInvalidPosting(InvalidPostingException ex) {
        return ex.getMessage();
    }
}

