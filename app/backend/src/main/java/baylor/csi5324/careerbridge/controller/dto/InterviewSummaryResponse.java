package baylor.csi5324.careerbridge.controller.dto;

import baylor.csi5324.careerbridge.model.Interview;

import java.time.LocalDateTime;

// BR-12, A12: applicant-facing interview details exclude recruiter outcomes and notes
public record InterviewSummaryResponse(Long interviewId, int roundNumber,
                                       LocalDateTime scheduledTime, String format, String location) {

    public static InterviewSummaryResponse from(Interview interview) {
        return new InterviewSummaryResponse(
                interview.getInterviewId(),
                interview.getRoundNumber(),
                interview.getScheduledTime(),
                interview.getFormat(),
                interview.getLocation());
    }
}

