package baylor.csi5324.careerbridge.model;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;

// Test fixtures reach a status the way production does: by walking fig-03 or fig-04 through the
// entity's own operations. A fixture therefore cannot build a state the specification forbids, and a
// change to a rule shows up in the fixtures that depend on it
public final class Lifecycles {

    public static final String ADMINISTRATOR = "Test Administrator";

    public static final OfferTerms TERMS = new OfferTerms(
            LocalDate.of(2027, 1, 4), "$80,000 per year", "Full-time", LocalDate.of(2027, 12, 31), null);

    private Lifecycles() {
    }

    // Decisions are replayed just before the deadline, so a posting whose deadline has passed can still
    // have been published; datePosted is kept as the test set it
    public static JobPosting inStatus(JobPosting posting, PostStatus target) {
        if (target == PostStatus.DRAFT) {
            return posting;
        }
        LocalDate datePosted = posting.getDatePosted();
        LocalDate deadline = posting.getApplicationDeadline();
        if (deadline == null) {
            posting.setApplicationDeadline(LocalDate.of(2999, 12, 31));
        }
        Instant decidedAt = earlier(Instant.now(), posting.closesAt().minus(Duration.ofHours(1)));
        posting.submit();
        switch (target) {
            case PENDING_APPROVAL -> { }
            case RETURNED -> posting.returnToRecruiter(ADMINISTRATOR, null, decidedAt);
            case REJECTED -> posting.reject(ADMINISTRATOR, null, decidedAt);
            case PUBLISHED -> posting.approve(null, null, decidedAt);
            case CLOSED -> {
                posting.approve(null, null, decidedAt);
                posting.closeByRecruiter(decidedAt);
            }
            case EXPIRED -> posting.expire(posting.closesAt());
            case DRAFT -> throw new IllegalStateException();
        }
        posting.setApplicationDeadline(deadline);
        posting.setDatePosted(datePosted);
        return posting;
    }

    public static JobPosting filled(JobPosting posting) {
        inStatus(posting, PostStatus.PUBLISHED);
        posting.fill(java.util.List.of(), Instant.now());
        return posting;
    }

    // Every stage change is dated on; a test that needs distinct dates calls the operations itself
    public static Application atStage(Application application, ApplicationStatus target, LocalDate on) {
        Instant at = on(application, on);
        switch (target) {
            case APPLIED -> { }
            case SCREENING, INTERVIEW -> {
                while (application.getApplicationStatus() != target) {
                    application.advance(application.getApplicationStatus(), at);
                }
            }
            case OFFER -> {
                atStage(application, ApplicationStatus.INTERVIEW, on);
                application.extendOffer(TERMS, at);
            }
            case HIRED -> {
                atStage(application, ApplicationStatus.OFFER, on);
                application.acceptOffer(1, 0, at);
            }
            case OFFER_DECLINED -> {
                atStage(application, ApplicationStatus.OFFER, on);
                application.declineOffer(1, null, at);
            }
            case REJECTED -> application.reject(ApplicationStatus.APPLIED, "Not a fit", null, at);
            case WITHDRAWN -> application.withdraw(null, at);
        }
        return application;
    }

    public static Application atStage(Application application, ApplicationStatus target) {
        return atStage(application, target, application.getDateApplied());
    }

    public static Instant on(Application application, LocalDate date) {
        return date.atTime(12, 0).atZone(application.getJobPosting().getOrganization().getZoneId()).toInstant();
    }

    private static Instant earlier(Instant a, Instant b) {
        return a.isBefore(b) ? a : b;
    }
}
