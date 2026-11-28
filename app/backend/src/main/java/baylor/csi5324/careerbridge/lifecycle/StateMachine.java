package baylor.csi5324.careerbridge.lifecycle;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.BiConsumer;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.function.Predicate;

// A lifecycle written as a table of transitions, so the code reads like the state diagram in the spec.
// Hand-written rather than a library: the whole engine fits on one screen and needs no ADR for a dependency.
// S = the states, E = the events (system operations), C = what a rule needs to know (entity, time, inputs).
public final class StateMachine<S extends Enum<S>, E extends Enum<E>, C> {

    public static final String WRONG_STATE = "wrong state";

    public record Rule<C>(String name, Predicate<C> refuseWhen, Function<C, String> message) {
    }

    public record Refusal(String rule, String message) {
    }

    // An empty `from` is the start pseudo-state [*]: drawn and checked, never fired
    public record Transition<S, E, C>(Set<S> from, E event, S to, Predicate<C> when,
                                      List<Rule<C>> rules, Consumer<C> effect) {
    }

    private final Class<S> states;
    private final Function<C, S> stateOf;
    // Writes the new state and its history entry together, so the two cannot drift apart
    private final BiConsumer<C, S> enter;
    private final List<Transition<S, E, C>> table = new ArrayList<>();
    private final Map<E, Function<C, String>> wrongState = new HashMap<>();
    private final Predicate<C> always = c -> true;

    public StateMachine(Class<S> states, Function<C, S> stateOf, BiConsumer<C, S> enter) {
        this.states = states;
        this.stateOf = stateOf;
        this.enter = enter;
    }

    @SafeVarargs
    public final TransitionBuilder from(S... from) {
        return new TransitionBuilder(from.length == 0 ? EnumSet.noneOf(states) : EnumSet.of(from[0], from));
    }

    // The user-facing message when the event exists but not in the current state
    public StateMachine<S, E, C> whenNotAllowed(E event, Function<C, String> message) {
        wrongState.put(event, message);
        return this;
    }

    // The first rule that refuses, in table order; empty when the event may fire
    public Optional<Refusal> refusal(C context, E event) {
        S state = stateOf.apply(context);
        Optional<Transition<S, E, C>> transition = select(state, event, context);
        if (transition.isEmpty()) {
            Function<C, String> message = wrongState.getOrDefault(event, c -> event + " is not possible in " + state);
            return Optional.of(new Refusal(WRONG_STATE, message.apply(context)));
        }
        return transition.get().rules().stream().filter(rule -> rule.refuseWhen().test(context)).findFirst()
                .map(rule -> new Refusal(rule.name(), rule.message().apply(context)));
    }

    public S fire(C context, E event) {
        S state = stateOf.apply(context);
        refusal(context, event).ifPresent(refused -> {
            throw new TransitionRefusedException(state, event, refused.rule(), refused.message());
        });
        Transition<S, E, C> transition = select(state, event, context).orElseThrow();
        if (transition.to() != state) {
            enter.accept(context, transition.to());
        }
        transition.effect().accept(context);
        return transition.to();
    }

    // For the UI: the events allowed now, in table order
    public List<E> allowedEvents(C context) {
        return table.stream().map(Transition::event).distinct()
                .filter(event -> refusal(context, event).isEmpty()).toList();
    }

    // Seed data and test fixtures: walk the table's edges to a state without its rules or effects, so a
    // mid-lifecycle object can only be one the diagram can reach, with one history entry per step
    public List<S> restore(C context, S target) {
        List<S> path = pathTo(stateOf.apply(context), target);
        path.forEach(step -> enter.accept(context, step));
        return path;
    }

    public List<S> pathTo(S start, S target) {
        Map<S, S> cameFrom = new HashMap<>();
        ArrayDeque<S> queue = new ArrayDeque<>(List.of(start));
        while (!queue.isEmpty() && !cameFrom.containsKey(target) && start != target) {
            S state = queue.poll();
            for (Transition<S, E, C> t : table) {
                // A conditional branch (approve after the deadline) is never the plain way to a state
                if (t.from().contains(state) && t.when() == always && !cameFrom.containsKey(t.to()) && t.to() != start) {
                    cameFrom.put(t.to(), state);
                    queue.add(t.to());
                }
            }
        }
        if (start != target && !cameFrom.containsKey(target)) {
            throw new IllegalArgumentException(target + " cannot be reached from " + start);
        }
        List<S> path = new ArrayList<>();
        for (S step = target; step != start; step = cameFrom.get(step)) {
            path.add(step);
        }
        Collections.reverse(path);
        return path;
    }

    // "FROM -> TO" with the events on that edge, for the traceability test and the diagram
    public Map<String, List<String>> edges() {
        Map<String, List<String>> edges = new LinkedHashMap<>();
        for (Transition<S, E, C> t : table) {
            Set<S> from = t.from();
            List<S> sources = from.isEmpty() ? Collections.singletonList(null) : List.copyOf(from);
            for (S source : sources) {
                String key = (source == null ? "[*]" : source.name()) + " -> " + t.to().name();
                edges.computeIfAbsent(key, k -> new ArrayList<>()).add(t.event().name());
            }
        }
        return edges;
    }

    // Paste into a ```mermaid block next to the spec figure to compare the two
    public String toMermaid() {
        StringBuilder out = new StringBuilder("stateDiagram-v2\n");
        edges().forEach((edge, events) -> out.append("    ").append(edge.replace("->", "-->"))
                .append(" : ").append(String.join(", ", events)).append('\n'));
        Set<S> withExit = EnumSet.noneOf(states);
        table.forEach(t -> withExit.addAll(t.from()));
        for (S state : states.getEnumConstants()) {
            if (!withExit.contains(state)) {
                out.append("    ").append(state.name()).append(" --> [*]\n");
            }
        }
        return out.toString();
    }

    private Optional<Transition<S, E, C>> select(S state, E event, C context) {
        return table.stream()
                .filter(t -> t.event() == event && t.from().contains(state) && t.when().test(context))
                .findFirst();
    }

    public final class TransitionBuilder {
        private final Set<S> from;
        private E event;
        private S to;
        private Predicate<C> when = always;
        private final List<Rule<C>> rules = new ArrayList<>();

        private TransitionBuilder(Set<S> from) {
            this.from = from;
        }

        public TransitionBuilder on(E event) {
            this.event = event;
            return this;
        }

        // A UML guard: picks between two edges for the same event; not a refusal
        public TransitionBuilder when(Predicate<C> condition) {
            this.when = condition;
            return this;
        }

        public TransitionBuilder to(S to) {
            this.to = to;
            return this;
        }

        public TransitionBuilder refuseIf(String name, Predicate<C> refuseWhen, Function<C, String> message) {
            rules.add(new Rule<>(name, refuseWhen, message));
            return this;
        }

        public StateMachine<S, E, C> then(Consumer<C> effect) {
            table.add(new Transition<>(from, event, to, when, List.copyOf(rules), effect));
            return StateMachine.this;
        }

        public StateMachine<S, E, C> end() {
            return then(c -> { });
        }
    }
}
