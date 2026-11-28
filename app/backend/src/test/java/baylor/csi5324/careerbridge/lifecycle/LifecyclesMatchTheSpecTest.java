package baylor.csi5324.careerbridge.lifecycle;

import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

// The edges below are copied by hand from the spec figures. A change to a table that is not also a change
// to the figure fails here, and so does a figure edge that no table row implements.
class LifecyclesMatchTheSpecTest {

    // spec/diagrams/fig-03-application-pipeline-br-8.png
    private static final Set<String> FIG_03 = Set.of(
            "[*] -> APPLIED",
            "APPLIED -> SCREENING", "APPLIED -> REJECTED", "APPLIED -> WITHDRAWN",
            "SCREENING -> INTERVIEW", "SCREENING -> REJECTED", "SCREENING -> WITHDRAWN",
            "INTERVIEW -> OFFER", "INTERVIEW -> REJECTED", "INTERVIEW -> WITHDRAWN",
            "OFFER -> HIRED", "OFFER -> OFFER_DECLINED", "OFFER -> REJECTED");

    // spec/diagrams/fig-04-job-posting-lifecycle-br-9-br-10-a9.png
    private static final Set<String> FIG_04 = Set.of(
            "[*] -> DRAFT", "[*] -> PENDING_APPROVAL", "DRAFT -> PENDING_APPROVAL",
            "PENDING_APPROVAL -> PUBLISHED", "PENDING_APPROVAL -> RETURNED", "PENDING_APPROVAL -> REJECTED",
            "PENDING_APPROVAL -> EXPIRED", "RETURNED -> PENDING_APPROVAL", "RETURNED -> EXPIRED",
            "PUBLISHED -> CLOSED");

    // Offer status: UC-07, UC-15, A14 (no figure)
    private static final Set<String> OFFER = Set.of(
            "PENDING -> ACCEPTED", "PENDING -> DECLINED", "PENDING -> RESCINDED", "PENDING -> EXPIRED");

    @Test
    void theApplicationTableIsFigure3() {
        assertThat(stageChanges(ApplicationLifecycle.TABLE.edges())).isEqualTo(FIG_03);
        // Not drawn in fig-03 because the stage stays: CO-14.4 and CO-15.2
        assertThat(selfLoops(ApplicationLifecycle.TABLE.edges()))
                .containsExactlyInAnyOrder("INTERVIEW -> INTERVIEW", "OFFER -> OFFER");
    }

    @Test
    void theJobPostingTableIsFigure4() {
        assertThat(stageChanges(JobPostingLifecycle.TABLE.edges())).isEqualTo(FIG_04);
        assertThat(selfLoops(JobPostingLifecycle.TABLE.edges()))
                .containsExactlyInAnyOrder("DRAFT -> DRAFT", "RETURNED -> RETURNED");
    }

    @Test
    void theOfferTableHasTheFiveStatuses() {
        assertThat(stageChanges(OfferLifecycle.TABLE.edges())).isEqualTo(OFFER);
    }

    // The figure's edge labels, kept as event names, so a reader can find the contract
    @Test
    void edgesCarryTheirOperations() {
        Map<String, java.util.List<String>> edges = JobPostingLifecycle.TABLE.edges();
        assertThat(edges.get("PUBLISHED -> CLOSED"))
                .containsExactly("CLOSE_POSTING", "FILL_POSTING", "EXPIRE_POSTING");
        assertThat(edges.get("PENDING_APPROVAL -> RETURNED"))
                .containsExactly("APPROVE_JOB_POSTING", "RETURN_JOB_POSTING");
    }

    @Test
    void theMermaidDrawingEndsEveryTerminalState() {
        String mermaid = ApplicationLifecycle.TABLE.toMermaid();
        assertThat(mermaid).startsWith("stateDiagram-v2\n")
                .contains("[*] --> APPLIED : SUBMIT_APPLICATION")
                .contains("HIRED --> [*]", "OFFER_DECLINED --> [*]", "REJECTED --> [*]", "WITHDRAWN --> [*]")
                .doesNotContain("OFFER --> [*]");
    }

    private static Set<String> stageChanges(Map<String, ?> edges) {
        return edges.keySet().stream().filter(edge -> !isSelfLoop(edge)).collect(Collectors.toSet());
    }

    private static Set<String> selfLoops(Map<String, ?> edges) {
        return edges.keySet().stream().filter(LifecyclesMatchTheSpecTest::isSelfLoop).collect(Collectors.toSet());
    }

    private static boolean isSelfLoop(String edge) {
        String[] ends = edge.split(" -> ");
        return ends[0].equals(ends[1]);
    }
}
