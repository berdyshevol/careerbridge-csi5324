package baylor.csi5324.careerbridge.model;

import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

// A15: five failed log-ins within 15 minutes lock the account for 15 minutes
class UserLockTest {

    private final Instant start = Instant.parse("2026-10-25T12:00:00Z");

    @Test
    void theFifthFailureWithinTheWindowLocksForFifteenMinutes() {
        User user = new User();
        for (int i = 0; i < 4; i++) {
            user.recordFailedLogIn(start.plus(Duration.ofMinutes(i)));
        }
        assertFalse(user.isLockedAt(start.plusSeconds(240)));

        user.recordFailedLogIn(start.plus(Duration.ofMinutes(14)));

        assertTrue(user.isLockedAt(start.plus(Duration.ofMinutes(28))));
        assertFalse(user.isLockedAt(start.plus(Duration.ofMinutes(29))));
    }

    @Test
    void failuresOlderThanTheWindowDoNotCount() {
        User user = new User();
        for (int i = 0; i < 4; i++) {
            user.recordFailedLogIn(start);
        }
        user.recordFailedLogIn(start.plus(Duration.ofMinutes(15)));

        assertFalse(user.isLockedAt(start.plus(Duration.ofMinutes(15))));
    }

    @Test
    void aSuccessfulLogInClearsTheFailures() {
        User user = new User();
        for (int i = 0; i < 4; i++) {
            user.recordFailedLogIn(start);
        }
        user.recordLogIn();
        user.recordFailedLogIn(start);

        assertFalse(user.isLockedAt(start));
    }
}
