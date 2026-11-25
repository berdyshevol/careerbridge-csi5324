package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.controller.dto.RecruiterPostingsResponse;
import baylor.csi5324.careerbridge.service.RecruiterPostingsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

// UC-14 steps 1-2
@RestController
@RequestMapping("/api/recruiter/postings")
public class RecruiterPostingsController {

    private final RecruiterPostingsService recruiterPostingsService;

    public RecruiterPostingsController(RecruiterPostingsService recruiterPostingsService) {
        this.recruiterPostingsService = recruiterPostingsService;
    }

    @GetMapping
    public RecruiterPostingsResponse listPostings(Principal recruiter) {
        return RecruiterPostingsResponse.from(recruiterPostingsService.listPostings(recruiter.getName()));
    }
}
