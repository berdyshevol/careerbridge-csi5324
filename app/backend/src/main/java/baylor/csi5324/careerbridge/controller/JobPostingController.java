package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.service.JobPostingService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/postings")
public class JobPostingController {

    private final JobPostingService jobPostingService;

    public JobPostingController(JobPostingService jobPostingService) {
        this.jobPostingService = jobPostingService;
    }

    @GetMapping
    public List<JobPosting> searchPostings(@RequestParam(required = false) String keyword) {
        return jobPostingService.searchPostings(keyword);
    }

    @GetMapping("/{postingId}")
    public JobPosting viewPosting(@PathVariable Long postingId) {
        return jobPostingService.viewPosting(postingId);
    }
}
