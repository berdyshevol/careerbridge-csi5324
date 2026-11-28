package baylor.csi5324.careerbridge.lifecycle;

import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.JobPosting;

import java.time.Instant;
import java.util.List;

// Close Job Posting as the subfunction of UC-07 extension 6c (FR-UC07.7, A2, A3, BR-10, BR-11): one
// transition that spans three aggregates. The lifecycle cannot reach a repository, so the service loads
// the other applications and saves what changed; every rule and every move is decided here.
public final class PostingFilled {

    private PostingFilled() {
    }

    public static boolean fillsLastOpening(JobPosting posting, long hiredBefore) {
        return hiredBefore + 1 >= posting.getNumberOfOpenings();
    }

    // Returns the applications it rejected: the place to send their Notifications from, once they exist
    public static List<Application> closeFilledPosting(JobPosting posting, List<Application> remainingActive,
                                                       Instant now) {
        JobPostingLifecycle.Move fill = JobPostingLifecycle.Move.of(posting, now);
        if (JobPostingLifecycle.TABLE.refusal(fill, JobPostingLifecycle.Event.FILL_POSTING).isPresent()) {
            return List.of();
        }
        JobPostingLifecycle.TABLE.fire(fill, JobPostingLifecycle.Event.FILL_POSTING);
        for (Application other : remainingActive) {
            ApplicationLifecycle.TABLE.fire(
                    ApplicationLifecycle.Move.of(other, now).rejecting(ApplicationLifecycle.POSTING_CLOSED),
                    ApplicationLifecycle.Event.REJECT_APPLICATION);
        }
        return remainingActive;
    }
}
