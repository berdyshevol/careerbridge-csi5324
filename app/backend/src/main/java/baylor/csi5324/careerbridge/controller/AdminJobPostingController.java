package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.service.InvalidPostingException;
import baylor.csi5324.careerbridge.service.JobPostingService;
import baylor.csi5324.careerbridge.service.PostingStateConflictException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/postings")
public class AdminJobPostingController {

    private final JobPostingService jobPostingService;

    public AdminJobPostingController(JobPostingService jobPostingService) {
        this.jobPostingService = jobPostingService;
    }

    @GetMapping("/pending")
    public List<JobPosting> openPostingApprovalQueue() {
        return jobPostingService.getPendingPostings();
    }

    @PostMapping("/{postingId}/approve")
    public JobPosting approveJobPosting(
            @PathVariable Long postingId,
            @RequestBody(required = false) DecisionRequest request,
            Authentication administrator) {
        return jobPostingService.approveJobPosting(
                postingId, administrator.getName(), request == null ? null : request.comment());
    }

    @PostMapping("/{postingId}/return")
    public JobPosting returnJobPosting(
            @PathVariable Long postingId,
            @RequestBody DecisionRequest request,
            Authentication administrator) {
        return jobPostingService.returnJobPosting(
                postingId, administrator.getName(), request.comment());
    }

    @PostMapping("/{postingId}/reject")
    public JobPosting rejectJobPosting(
            @PathVariable Long postingId,
            @RequestBody DecisionRequest request,
            Authentication administrator) {
        return jobPostingService.rejectJobPosting(
                postingId, administrator.getName(), request.comment());
    }

    @ExceptionHandler(InvalidPostingException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public String handleInvalidDecision(InvalidPostingException ex) {
        return ex.getMessage();
    }

    // UC-12, extension 6c: the page shows the current status instead of a decision
    @ExceptionHandler(PostingStateConflictException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public String handleAlreadyDecided(PostingStateConflictException ex) {
        return ex.getMessage();
    }

    public record DecisionRequest(String comment) {
    }
}
