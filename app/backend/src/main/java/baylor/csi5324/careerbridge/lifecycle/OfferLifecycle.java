package baylor.csi5324.careerbridge.lifecycle;

import baylor.csi5324.careerbridge.model.Offer;
import baylor.csi5324.careerbridge.model.OfferStatus;

import java.time.LocalDate;

import static baylor.csi5324.careerbridge.model.OfferStatus.ACCEPTED;
import static baylor.csi5324.careerbridge.model.OfferStatus.DECLINED;
import static baylor.csi5324.careerbridge.model.OfferStatus.EXPIRED;
import static baylor.csi5324.careerbridge.model.OfferStatus.PENDING;
import static baylor.csi5324.careerbridge.model.OfferStatus.RESCINDED;

// Offer: Extended (stored as PENDING) -> Accepted | Declined | Rescinded | Expired (UC-07, UC-15, A14).
// Every event here is fired by an Application transition, never by a service on its own.
public final class OfferLifecycle {

    public enum Event { REVISE, ACCEPT, DECLINE, RESCIND, EXPIRE }

    public record Move(Offer offer, LocalDate date, OfferTerms terms) {
        public static Move on(Offer offer, LocalDate date) {
            return new Move(offer, date, null);
        }
    }

    public static final StateMachine<OfferStatus, Event, Move> TABLE =
            new StateMachine<OfferStatus, Event, Move>(OfferStatus.class,
                    m -> m.offer().getStatus(), (m, status) -> m.offer().enterStatus(status))
                    .from(PENDING).on(Event.REVISE).to(PENDING).then(m -> m.terms().applyTo(m.offer()))
                    .from(PENDING).on(Event.ACCEPT).to(ACCEPTED).then(m -> m.offer().recordResponse(m.date()))
                    .from(PENDING).on(Event.DECLINE).to(DECLINED).then(m -> m.offer().recordResponse(m.date()))
                    .from(PENDING).on(Event.RESCIND).to(RESCINDED).end()
                    // Not stored today: Offer.isExpired works it out from the date (A14); the edge is kept so
                    // the table matches the spec and a nightly job can fire it later
                    .from(PENDING).on(Event.EXPIRE).to(EXPIRED).end();

    private OfferLifecycle() {
    }

    static void fire(Offer offer, LocalDate date, Event event) {
        TABLE.fire(Move.on(offer, date), event);
    }

    // An offer that is already answered stays as it is when its application is rejected
    static void rescindIfOpen(Offer offer, LocalDate date) {
        if (offer != null && TABLE.refusal(Move.on(offer, date), Event.RESCIND).isEmpty()) {
            fire(offer, date, Event.RESCIND);
        }
    }
}
