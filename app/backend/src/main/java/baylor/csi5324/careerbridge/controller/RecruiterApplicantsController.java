package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.controller.dto.ApplicationReviewResponse;
import baylor.csi5324.careerbridge.controller.dto.PostingApplicantsResponse;
import baylor.csi5324.careerbridge.model.ResumeSnapshot;
import baylor.csi5324.careerbridge.service.RecruiterApplicationsService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

// UC-14 steps 3-4; a posting or application of another organization is a 404 (BR-15, FR-UC14.9)
@RestController
@RequestMapping("/api/recruiter")
public class RecruiterApplicantsController {

    private final RecruiterApplicationsService service;

    public RecruiterApplicantsController(RecruiterApplicationsService service) {
        this.service = service;
    }

    @GetMapping("/postings/{postingId}")
    public PostingApplicantsResponse viewPosting(Principal recruiter, @PathVariable Long postingId) {
        return PostingApplicantsResponse.from(service.viewPosting(recruiter.getName(), postingId));
    }

    @GetMapping("/applications/{applicationId}")
    public ApplicationReviewResponse reviewApplication(Principal recruiter, @PathVariable Long applicationId) {
        return ApplicationReviewResponse.from(service.reviewApplication(recruiter.getName(), applicationId));
    }

    @GetMapping("/applications/{applicationId}/resume")
    public ResponseEntity<byte[]> downloadResume(Principal recruiter, @PathVariable Long applicationId) {
        ResumeSnapshot snapshot = service.resumeOf(recruiter.getName(), applicationId);
        if (snapshot.getContent() == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(snapshot.getFileType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(snapshot.getFileName()).build().toString())
                .body(snapshot.getContent());
    }
}
