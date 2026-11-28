package baylor.csi5324.careerbridge.model;

import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Set;
import java.util.TreeSet;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;

// The figures are pictures, so their arrows are copied here by hand. A move added to or removed from
// an enum without the same change to its figure fails here, and the message prints both graphs as
// Mermaid so the figure can be redrawn from the code.
class LifecyclesMatchTheSpecTest {

    // spec/diagrams/fig-03-application-pipeline-br-8.png
    private static final Set<String> FIGURE_3 = Set.of(
            "APPLIED --> SCREENING", "APPLIED --> REJECTED", "APPLIED --> WITHDRAWN",
            "SCREENING --> INTERVIEW", "SCREENING --> REJECTED", "SCREENING --> WITHDRAWN",
            "INTERVIEW --> OFFER", "INTERVIEW --> REJECTED", "INTERVIEW --> WITHDRAWN",
            "OFFER --> HIRED", "OFFER --> OFFER_DECLINED", "OFFER --> REJECTED");

    // spec/diagrams/fig-04-job-posting-lifecycle-br-9-br-10-a9.png; "Closed by recruiter" (UC-13 *a)
    // shares the Published --> Closed arrow with "filled or expired"
    private static final Set<String> FIGURE_4 = Set.of(
            "DRAFT --> PENDING_APPROVAL",
            "PENDING_APPROVAL --> PUBLISHED", "PENDING_APPROVAL --> RETURNED",
            "PENDING_APPROVAL --> REJECTED", "PENDING_APPROVAL --> EXPIRED",
            "RETURNED --> PENDING_APPROVAL", "RETURNED --> EXPIRED",
            "PUBLISHED --> CLOSED");

    // No figure: UC-07, UC-15 and A14 name the answers to an extended offer
    private static final Set<String> OFFER_ANSWERS = Set.of(
            "PENDING --> ACCEPTED", "PENDING --> DECLINED", "PENDING --> EXPIRED", "PENDING --> RESCINDED");

    @Test
    void theApplicationPipelineIsFigure3() {
        assertSameGraph(FIGURE_3, edges(ApplicationStatus.values(), ApplicationStatus::allowedMoves));
    }

    @Test
    void thePostingLifecycleIsFigure4() {
        assertSameGraph(FIGURE_4, edges(PostStatus.values(), PostStatus::allowedMoves));
    }

    @Test
    void anExtendedOfferEndsInOneAnswer() {
        assertSameGraph(OFFER_ANSWERS, edges(OfferStatus.values(), OfferStatus::allowedMoves));
    }

    private static <S extends Enum<S>> Set<String> edges(S[] states, Function<S, Set<S>> allowedMoves) {
        return Arrays.stream(states)
                .flatMap(from -> allowedMoves.apply(from).stream().map(to -> from + " --> " + to))
                .collect(Collectors.toCollection(TreeSet::new));
    }

    private static void assertSameGraph(Set<String> figure, Set<String> code) {
        assertEquals(new TreeSet<>(figure), code,
                () -> "The figure:\n" + mermaid(figure) + "\nThe code:\n" + mermaid(code));
    }

    private static String mermaid(Set<String> edges) {
        return new TreeSet<>(edges).stream()
                .map(edge -> "    " + edge)
                .collect(Collectors.joining("\n", "stateDiagram-v2\n", "\n"));
    }
}
