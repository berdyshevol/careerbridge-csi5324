package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.NotificationType;
import baylor.csi5324.careerbridge.model.User;
import baylor.csi5324.careerbridge.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

// Log In, forgotten password: CO-LI.1 requestPasswordReset and CO-LI.2 resetPassword
@Service
@Transactional
public class PasswordResetService {

    static final Duration RESET_LINK_LIFETIME = Duration.ofMinutes(30);
    static final String RESET_PATH = "/reset-password?token=";

    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;
    private final String frontendOrigin;
    private final boolean showResetLinks;

    public PasswordResetService(UserRepository userRepository, NotificationService notificationService,
                                PasswordEncoder passwordEncoder, Clock clock,
                                @Value("${careerbridge.frontend-origins}") String frontendOrigins,
                                @Value("${careerbridge.demo.verification-links}") boolean demoLinks,
                                @Value("${careerbridge.demo.local-passwords}") boolean localDemo,
                                @Value("${spring.datasource.url}") String databaseUrl) {
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
        this.frontendOrigin = frontendOrigins.split(",")[0].strip();
        // The same switch as UC-08's verification link: there is no mail service, so a demo hands the link back
        this.showResetLinks = demoLinks || localDemo && databaseUrl.startsWith("jdbc:h2:mem:");
    }

    // CO-LI.1. Empty for an unknown email, and the page answers the same either way, so the form does not
    // reveal who has an account; only a demo, which shows the link, can tell the two apart
    public Optional<String> requestPasswordReset(String email) {
        Optional<User> user = userRepository.findByEmailIgnoreCase(AccountRules.email(email));
        if (user.isEmpty() || user.get().getPasswordHash() == null) {
            return Optional.empty();
        }
        OneTimeToken token = OneTimeToken.create();
        user.get().startPasswordReset(token.hash(), clock.instant().plus(RESET_LINK_LIFETIME));
        notificationService.notify(user.get(), NotificationType.PASSWORD_RESET,
                "Open " + frontendOrigin + RESET_PATH + token.token()
                        + " within 30 minutes to choose a new password. If you did not ask for it, ignore this message.");
        return showResetLinks ? Optional.of(RESET_PATH + token.token()) : Optional.empty();
    }

    // CO-LI.2
    public void resetPassword(String token, String newPassword) {
        User user = token == null || token.isBlank() ? null
                : userRepository.findByPasswordResetTokenHash(OneTimeToken.hash(token.strip())).orElse(null);
        if (user == null) {
            throw new PasswordResetLinkException(false);
        }
        if (!clock.instant().isBefore(user.getPasswordResetExpiresAt())) {
            throw new PasswordResetLinkException(true);
        }
        Map<String, String> errors = new LinkedHashMap<>();
        AccountRules.checkPassword(newPassword, errors);
        if (!errors.isEmpty()) {
            throw new RegistrationRefusedException(errors);
        }
        user.resetPassword(passwordEncoder.encode(newPassword));
    }
}
