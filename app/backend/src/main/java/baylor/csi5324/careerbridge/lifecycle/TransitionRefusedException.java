package baylor.csi5324.careerbridge.lifecycle;

// The rule name lets a service pick its own exception (and HTTP status) without parsing the message
public class TransitionRefusedException extends RuntimeException {

    private final Enum<?> state;
    private final Enum<?> event;
    private final String rule;

    public TransitionRefusedException(Enum<?> state, Enum<?> event, String rule, String message) {
        super(message);
        this.state = state;
        this.event = event;
        this.rule = rule;
    }

    public Enum<?> getState() {
        return state;
    }

    public Enum<?> getEvent() {
        return event;
    }

    public String getRule() {
        return rule;
    }
}
