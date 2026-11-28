package baylor.csi5324.careerbridge.model;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

// BR-8 and fig-03 without Spring: the pipeline is the entity's to keep
class ApplicationLifecycleTest {

    private static final LocalDate APPLIED_ON = LocalDate.of(2026, 10, 1);
    private static final Instant NOW = Instant.parse("2026-10-20T15:00:00Z");

    private final JobPosting posting = publishedPosting();

    private static JobPosting publishedPosting() {
        JobPosting posting = new JobPosting();
        posting.setOrganization(new Organization("Brazos Analytics"));
        posting.setApplicationDeadline(LocalDate.of(2026, 12, 31));
        return Lifecycles.inStatus(posting, PostStatus.PUBLISHED);
    }

    private Application applied() {
        return new Application(new Applicant(), posting, new ResumeSnapshot("cv.pdf", "application/pdf", 1L), APPLIED_ON);
    }

    private Application at(ApplicationStatus stage) {
        return Lifecycles.atStage(applied(), stage);
    }

    private static void assertHistoryEndsAtTheStage(Application application) {
        List<StatusHistoryEntry> history = application.getStatusHistory();
        assertEquals(application.getApplicationStatus(), history.get(history.size() - 1).getStatus());
    }

    @Test
    void thePipelineIsExactlyTheArrowsOfFig03() {
        int arrows = 0;
        for (ApplicationStatus from : ApplicationStatus.values()) {
            arrows += from.allowedMoves().size();
        }
        assertEquals(12, arrows);
        assertEquals(EnumSet.of(ApplicationStatus.HIRED, ApplicationStatus.OFFER_DECLINED, ApplicationStatus.REJECTED),
                ApplicationStatus.OFFER.allowedMoves());
        assertTrue(ApplicationStatus.HIRED.allowedMoves().isEmpty());
        assertEquals(Optional.empty(), ApplicationStatus.INTERVIEW.nextStage());
    }

    @Test
    void advancesOneStageAtATimeAndRecordsEachInTheHistory() {
        Application application = applied();

        application.advance(ApplicationStatus.APPLIED, NOW);
        application.advance(ApplicationStatus.SCREENING, NOW);

        assertEquals(ApplicationStatus.INTERVIEW, application.getApplicationStatus());
        assertEquals(List.of(ApplicationStatus.APPLIED, ApplicationStatus.SCREENING, ApplicationStatus.INTERVIEW),
                application.getStatusHistory().stream().map(StatusHistoryEntry::getStatus).toList());
        assertEquals(LocalDate.of(2026, 10, 20), application.getLastStageChangeDate());
    }

    @Test
    void refusesToAdvanceFromInterviewAndSaysWhatToDoInstead() {
        Application application = at(ApplicationStatus.INTERVIEW);

        ApplicationActionRefusedException refused = assertThrows(ApplicationActionRefusedException.class,
                () -> application.advance(ApplicationStatus.INTERVIEW, NOW));

        assertEquals("This application is at the Interview stage. Extend an offer or reject it instead.",
                refused.getMessage());
        assertEquals(3, application.getStatusHistory().size());
    }

    @Test
    void refusesAMoveWhenTheStageChangedSinceTheRecruiterLooked() {
        Application application = at(ApplicationStatus.SCREENING);

        ApplicationActionRefusedException refused = assertThrows(ApplicationActionRefusedException.class,
                () -> application.reject(ApplicationStatus.APPLIED, "Not a fit", null, NOW));

        assertEquals(ApplicationStatus.SCREENING, refused.getCurrentStage());
        assertEquals(ApplicationStatus.SCREENING, application.getApplicationStatus());
    }

    @Test
    void extendsAnOfferOnlyFromInterview() {
        Application screening = at(ApplicationStatus.SCREENING);
        assertThrows(ApplicationActionRefusedException.class, () -> screening.extendOffer(Lifecycles.TERMS, NOW));

        Application interviewed = at(ApplicationStatus.INTERVIEW);
        Offer offer = interviewed.extendOffer(Lifecycles.TERMS, NOW);

        assertEquals(ApplicationStatus.OFFER, interviewed.getApplicationStatus());
        assertEquals(OfferStatus.PENDING, offer.getStatus());
        assertEquals(1, offer.getRevision());
        assertEquals(LocalDate.of(2026, 10, 20), offer.getDateExtended());
        assertHistoryEndsAtTheStage(interviewed);
    }

    @Test
    void refusesAnOfferOnceThePostingIsFilled() {
        Application interviewed = at(ApplicationStatus.INTERVIEW);
        posting.fill(List.of(), NOW);

        assertThrows(ApplicationActionRefusedException.class, () -> interviewed.extendOffer(Lifecycles.TERMS, NOW));
    }

    @Test
    void aRevisionKeepsTheStageAndIsRecordedUnderIt() {
        Application application = at(ApplicationStatus.OFFER);
        OfferTerms better = new OfferTerms(Lifecycles.TERMS.startDate(), "$90,000 per year", null,
                Lifecycles.TERMS.expirationDate(), null);

        application.reviseOffer(better, NOW);

        assertEquals(ApplicationStatus.OFFER, application.getApplicationStatus());
        assertEquals(2, application.getOffer().getRevision());
        assertEquals("$90,000 per year", application.getOffer().getSalary());
        assertEquals("Offer revised (revision 2)",
                application.getStatusHistory().get(application.getStatusHistory().size() - 1).getReason());
        assertHistoryEndsAtTheStage(application);
    }

    @Test
    void anAnsweredOfferIsNotRevised() {
        Application application = at(ApplicationStatus.OFFER_DECLINED);

        assertThrows(ApplicationActionRefusedException.class, () -> application.reviseOffer(Lifecycles.TERMS, NOW));
    }

    @Test
    void rejectingAtOfferRescindsTheOffer() {
        Application application = at(ApplicationStatus.OFFER);

        application.reject(ApplicationStatus.OFFER, "Position filled internally", "Budget cut", NOW);

        assertEquals(ApplicationStatus.REJECTED, application.getApplicationStatus());
        assertEquals(OfferStatus.RESCINDED, application.getOffer().getStatus());
        assertEquals(ApplicationStatus.OFFER, application.getRejectedAtStage());
        assertEquals("Position filled internally", application.getRejectionReason());
    }

    @Test
    void withdrawingAtOfferIsRefusedWithTheAdviceTheScreenShows() {
        Application application = at(ApplicationStatus.OFFER);

        ApplicationActionRefusedException refused = assertThrows(ApplicationActionRefusedException.class,
                () -> application.withdraw(null, NOW));

        assertEquals("This application is at the Offer stage. Use Decline on the offer instead.", refused.getMessage());
        assertEquals(List.of("ACCEPT_OFFER", "DECLINE_OFFER"), application.availableActions(NOW));
    }

    @Test
    void withdrawingRecordsTheMomentAndTheReason() {
        Application application = at(ApplicationStatus.SCREENING);

        application.withdraw("Moved away", NOW);

        assertEquals(ApplicationStatus.WITHDRAWN, application.getApplicationStatus());
        assertEquals(NOW, application.getWithdrawnAt());
        assertEquals("Moved away",
                application.getStatusHistory().get(application.getStatusHistory().size() - 1).getReason());
    }

    @Test
    void anAcceptanceAnswersTheTermsTheApplicantSaw() {
        Application application = at(ApplicationStatus.OFFER);
        application.reviseOffer(Lifecycles.TERMS, NOW);

        assertThrows(OfferRevisedException.class, () -> application.acceptOffer(1, 0, NOW));

        application.acceptOffer(2, 0, NOW);
        assertEquals(ApplicationStatus.HIRED, application.getApplicationStatus());
        assertEquals(OfferStatus.ACCEPTED, application.getOffer().getStatus());
        assertEquals(LocalDate.of(2026, 10, 20), application.getOffer().getResponseDate());
    }

    @Test
    void anAcceptanceIsRefusedWhenEveryOpeningIsFilled() {
        Application application = at(ApplicationStatus.OFFER);

        assertThrows(ApplicationActionRefusedException.class, () -> application.acceptOffer(1, 1, NOW));
        assertEquals(ApplicationStatus.OFFER, application.getApplicationStatus());
    }

    @Test
    void anExpiredOfferCannotBeAnsweredAndOffersNoButtons() {
        Application application = at(ApplicationStatus.OFFER);
        Instant afterDeadline = Instant.parse("2028-01-02T00:00:00Z");

        assertThrows(ApplicationActionRefusedException.class, () -> application.declineOffer(1, null, afterDeadline));
        assertEquals(List.of(), application.availableActions(afterDeadline));
    }

    @Test
    void allowsTwoInterviewRoundsAtMost() {
        Application application = at(ApplicationStatus.INTERVIEW);
        LocalDateTime time = LocalDateTime.of(2026, 10, 22, 14, 0);

        assertEquals(1, application.recordInterview(time, "Video", "Zoom").getRoundNumber());
        assertEquals(2, application.recordInterview(time.plusDays(2), "On-site", "Waco").getRoundNumber());
        assertThrows(ApplicationActionRefusedException.class,
                () -> application.recordInterview(time.plusDays(4), "On-site", "Waco"));
    }

    @ParameterizedTest
    @EnumSource(value = ApplicationStatus.class, names = {"HIRED", "REJECTED", "WITHDRAWN", "OFFER_DECLINED"})
    void aFinalStageRefusesEveryOperation(ApplicationStatus stage) {
        Application application = at(stage);

        assertThrows(ApplicationActionRefusedException.class, () -> application.advance(stage, NOW));
        assertThrows(ApplicationActionRefusedException.class, () -> application.reject(stage, "Not a fit", null, NOW));
        assertThrows(ApplicationActionRefusedException.class, () -> application.withdraw(null, NOW));
        assertThrows(ApplicationActionRefusedException.class, () -> application.extendOffer(Lifecycles.TERMS, NOW));
        assertEquals(List.of(), application.availableActions(NOW));
        assertHistoryEndsAtTheStage(application);
    }

    @Test
    void theHistoryCannotBeChangedFromOutside() {
        Application application = applied();

        assertThrows(UnsupportedOperationException.class,
                () -> application.getStatusHistory().add(new StatusHistoryEntry(ApplicationStatus.HIRED, APPLIED_ON)));
        assertNull(application.getOffer());
    }
}
