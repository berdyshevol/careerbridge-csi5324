package baylor.csi5324.careerbridge.lifecycle;

import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.Offer;
import baylor.csi5324.careerbridge.model.PostStatus;

import java.time.Instant;

// Mid-lifecycle objects for tests: restore to the stage before, then fire the real last event, so a
// fixture carries exactly the fields that event would have set
public final class LifecycleFixtures {

    private LifecycleFixtures() {
    }

    public static JobPosting decided(JobPosting posting, JobPostingLifecycle.Event decision, String administrator,
                                     String comment, Instant at) {
        JobPostingLifecycle.restore(posting, PostStatus.PENDING_APPROVAL);
        JobPostingLifecycle.TABLE.fire(JobPostingLifecycle.Move.of(posting, at).decidedBy(administrator, comment, true),
                decision);
        return posting;
    }

    public static JobPosting closed(JobPosting posting, JobPostingLifecycle.Event closing, Instant at) {
        JobPostingLifecycle.restore(posting, PostStatus.PUBLISHED);
        JobPostingLifecycle.fire(posting, at, closing);
        return posting;
    }

    public static Application withdrawn(Application application, Instant at) {
        ApplicationLifecycle.TABLE.fire(ApplicationLifecycle.Move.of(application, at),
                ApplicationLifecycle.Event.WITHDRAW_APPLICATION);
        return application;
    }

    public static Application rejected(Application application, String reason, Instant at) {
        ApplicationLifecycle.TABLE.fire(ApplicationLifecycle.Move.of(application, at).rejecting(reason),
                ApplicationLifecycle.Event.REJECT_APPLICATION);
        return application;
    }

    public static Application withOffer(Application application, Offer offer) {
        ApplicationLifecycle.restore(application, ApplicationStatus.OFFER);
        application.setOffer(offer);
        return application;
    }

    public static Application hired(Application application, Offer offer, Instant at) {
        withOffer(application, offer);
        ApplicationLifecycle.TABLE.fire(ApplicationLifecycle.Move.of(application, at),
                ApplicationLifecycle.Event.ACCEPT_OFFER);
        return application;
    }

    // Same terms, next revision: what a recruiter's CO-15.2 reviseOffer leaves behind
    public static Offer revised(Offer offer, String salary) {
        OfferLifecycle.TABLE.fire(new OfferLifecycle.Move(offer, offer.getDateExtended(), new OfferTerms(
                offer.getStartDate(), salary, offer.getTerms(), offer.getExpirationDate(),
                offer.getOfferLetterFileName())), OfferLifecycle.Event.REVISE);
        return offer;
    }
}
