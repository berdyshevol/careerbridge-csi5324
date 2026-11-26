package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.NotificationType;
import baylor.csi5324.careerbridge.model.User;
import baylor.csi5324.careerbridge.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PasswordResetServiceTest {

    private static final Instant NOW = Instant.parse("2026-11-25T18:00:00Z");

    private final UserRepository userRepository = mock(UserRepository.class);
    private final NotificationService notificationService = mock(NotificationService.class);
    private final PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    private final User user = new Applicant();

    private PasswordResetService serviceAt(Instant now, boolean demoLinks) {
        user.setEmail("pat@example.com");
        user.setPasswordHash("old-hash");
        when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("pat@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode(anyString())).thenReturn("new-hash");
        return new PasswordResetService(userRepository, notificationService, passwordEncoder,
                Clock.fixed(now, ZoneOffset.UTC), "https://careerbridge.example", demoLinks, false,
                "jdbc:postgresql://example/neondb");
    }

    @Test
    void sendsTheLinkAsANotificationAndShowsItOnlyInADemo() {
        Optional<String> shown = serviceAt(NOW, false).requestPasswordReset(" Pat@Example.com ");

        assertThat(shown).isEmpty();
        verify(notificationService).notify(eq(user), eq(NotificationType.PASSWORD_RESET),
                argThat(message -> message.contains("https://careerbridge.example/reset-password?token=")));
        assertThat(user.getPasswordResetExpiresAt()).isEqualTo(NOW.plus(PasswordResetService.RESET_LINK_LIFETIME));
    }

    @Test
    void anUnknownEmailSendsNothing() {
        assertThat(serviceAt(NOW, true).requestPasswordReset("nobody@example.com")).isEmpty();

        verify(notificationService, never()).notify(any(), any(), anyString());
    }

    @Test
    void aLinkOlderThanThirtyMinutesHasExpired() {
        String link = serviceAt(NOW, true).requestPasswordReset("pat@example.com").orElseThrow();
        String token = link.substring(link.indexOf("token=") + "token=".length());
        when(userRepository.findByPasswordResetTokenHash(OneTimeToken.hash(token))).thenReturn(Optional.of(user));

        PasswordResetService later = serviceAt(NOW.plus(PasswordResetService.RESET_LINK_LIFETIME), true);

        assertThatThrownBy(() -> later.resetPassword(token, "New-password-2"))
                .isInstanceOfSatisfying(PasswordResetLinkException.class, ex -> assertThat(ex.isExpired()).isTrue());
        assertThat(user.getPasswordHash()).isEqualTo("old-hash");
    }
}
