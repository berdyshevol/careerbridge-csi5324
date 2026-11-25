package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.dto.CreateJobPostingRequest;
import baylor.csi5324.careerbridge.dto.PostingSearchCriteria;
import baylor.csi5324.careerbridge.dto.PublicPosting;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.service.InvalidPostingException;
import baylor.csi5324.careerbridge.service.JobPostingService;
import baylor.csi5324.careerbridge.service.PostingNotAllowedException;
import baylor.csi5324.careerbridge.service.PostingStateConflictException;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/postings")
public class JobPostingController {

    private final JobPostingService jobPostingService;

    public JobPostingController(JobPostingService jobPostingService) {
        this.jobPostingService = jobPostingService;
    }

    @GetMapping
    public List<PublicPosting> searchPostings(PostingSearchCriteria criteria) {
        return jobPostingService.searchPostings(criteria).stream().map(PublicPosting::of).toList();
    }

    @GetMapping("/{postingId}")
    public PublicPosting viewPosting(@PathVariable Long postingId) {
        return PublicPosting.of(jobPostingService.viewPosting(postingId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public JobPosting createPosting(
            @RequestBody CreateJobPostingRequest request, Principal recruiter) {
        return jobPostingService.createPosting(request, recruiter.getName());
    }

    @PostMapping("/{postingId}/submit")
    public JobPosting submitJobPosting(@PathVariable Long postingId, Principal recruiter) {
        return jobPostingService.submitJobPosting(postingId, recruiter.getName());
    }

    @PostMapping("/{postingId}/close")
    public JobPosting closePosting(@PathVariable Long postingId, Principal recruiter) {
        return jobPostingService.closePosting(postingId, recruiter.getName());
    }

    // Only these three exceptions: any other failure is the server's, not the recruiter's
    @ExceptionHandler(InvalidPostingException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public String handleInvalidPosting(InvalidPostingException ex) {
        return ex.getMessage();
    }

    @ExceptionHandler(PostingNotAllowedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public String handleNotAllowed(PostingNotAllowedException ex) {
        return ex.getMessage();
    }

    @ExceptionHandler(PostingStateConflictException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public String handleStatusConflict(PostingStateConflictException ex) {
        return ex.getMessage();
    }
}
