package baylor.csi5324.careerbridge.config;

import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.PostStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

// Sample data reaches its status the way real data does, through the lifecycle operations, so a
// seeded posting or application can never be in a state fig-03 or fig-04 does not allow
final class SeedLifecycle {

    private SeedLifecycle() {
    }

    // decidedAt is when the Administrator decided; it must be before the deadline for a Published one
    static void walkPostingTo(JobPosting posting, PostStatus target, String administrator, String comment,
                              Instant decidedAt) {
        if (target == PostStatus.DRAFT) {
            return;
        }
        posting.submit();
        switch (target) {
            case PENDING_APPROVAL -> { }
            case RETURNED -> posting.returnToRecruiter(administrator, comment, decidedAt);
            case REJECTED -> posting.reject(administrator, comment, decidedAt);
            case EXPIRED -> posting.expire(posting.closesAt());
            case PUBLISHED -> posting.approve(administrator, comment, decidedAt);
            case CLOSED -> {
                posting.approve(administrator, comment, decidedAt);
                posting.closeByRecruiter(decidedAt);
            }
            case DRAFT -> throw new IllegalStateException();
        }
    }

    // Midday, so the date is the same calendar day in the organization's zone (A14)
    static Instant on(LocalDate date, ZoneId zoneId) {
        return date.atTime(12, 0).atZone(zoneId).toInstant();
    }
}
