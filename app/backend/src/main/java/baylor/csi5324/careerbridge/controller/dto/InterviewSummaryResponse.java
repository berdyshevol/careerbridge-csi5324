package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.model.Interview;

import java.time.LocalDateTime;

// Outcomes and internal notes are omitted so they never reach the applicant (BR-12, A12)
public record InterviewSummaryResponse(
        Long interviewId,
        LocalDateTime scheduledTime,
        String format,
        String location) {

    public static InterviewSummaryResponse from(Interview interview) {
        return new InterviewSummaryResponse(
                interview.getInterviewId(),
                interview.getScheduledTime(),
                interview.getFormat(),
                interview.getLocation());
    }
}

