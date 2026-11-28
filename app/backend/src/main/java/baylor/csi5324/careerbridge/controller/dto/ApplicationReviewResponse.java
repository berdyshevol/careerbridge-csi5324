package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.ResumeSnapshot;
import baylor.csi5324.careerbridge.service.ApplicationReview;

import java.time.LocalDate;
import java.util.List;

// The profile lists the details the review screen draws; the applicant's skills, education and work
// experience stay out, since the resume copy is what the application was judged on (A6).
public record ApplicationReviewResponse(Long applicationId, Long postingId, String postingTitle,
                                        String applicantName, ApplicationStatus stage, Resume resume,
                                        Profile profile, List<Entry> history) {

    // downloadable is false for a snapshot taken before uploads existed: it has a name but no file
    public record Resume(String fileName, String fileType, long fileSize, boolean downloadable) {
    }

    public record Profile(String email, String phone, String location, String headline) {
    }

    public record Entry(ApplicationStatus stage, LocalDate date) {
    }

    public static ApplicationReviewResponse from(ApplicationReview review) {
        ResumeSnapshot snapshot = review.resume();
        return new ApplicationReviewResponse(review.applicationId(), review.postingId(), review.postingTitle(),
                review.applicantName(), review.stage(),
                new Resume(snapshot.getFileName(), snapshot.getFileType(), snapshot.getFileSize(),
                        snapshot.getContent() != null),
                new Profile(review.applicant().getEmail(), review.applicant().getPhone(),
                        review.applicant().getLocation(), review.applicant().getHeadline()),
                review.history().stream().map(entry -> new Entry(entry.getStatus(), entry.getDate())).toList());
    }
}
