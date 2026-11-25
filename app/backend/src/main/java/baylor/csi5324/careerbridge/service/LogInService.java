package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.MembershipStatus;
import baylor.csi5324.careerbridge.model.OrganizationMembership;
import baylor.csi5324.careerbridge.model.Recruiter;
import baylor.csi5324.careerbridge.model.Role;
import baylor.csi5324.careerbridge.model.User;
import baylor.csi5324.careerbridge.repository.OrganizationMembershipRepository;
import baylor.csi5324.careerbridge.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

// Log In (spec/use-cases.md): checks the credentials and the account's state, then starts a
// session with the account's role. The session is a signed token the frontend sends back (ADR-0010).
@Service
@Transactional(noRollbackFor = LogInRefusedException.class)
public class LogInService {

    private static final Duration SESSION_LENGTH = Duration.ofHours(8);
    public static final String ROLE_CLAIM = "role";

    // The same answer for an unknown email and a wrong password, so the form does not reveal who has an account
    static final String WRONG_CREDENTIALS = "The email or password is not right. Check both and try again.";
    // Wording of the mockup visitor-login; the numbers are A15's, kept in User
    static final String LOCKED = "This account is locked. Five failed log-ins within 15 minutes lock it for 15 minutes.";

    private final UserRepository userRepository;
    private final OrganizationMembershipRepository membershipRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final Clock clock;
    // Checked for an unknown email, so it takes as long to refuse as a wrong password
    private final String unknownUserHash;

    public LogInService(UserRepository userRepository, OrganizationMembershipRepository membershipRepository,
                        PasswordEncoder passwordEncoder, JwtEncoder jwtEncoder, Clock clock) {
        this.userRepository = userRepository;
        this.membershipRepository = membershipRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.clock = clock;
        this.unknownUserHash = passwordEncoder.encode("no account has this password");
    }

    public LoggedIn logIn(String email, String password) {
        Instant now = clock.instant();
        Optional<User> found = Optional.ofNullable(email).map(String::trim).flatMap(userRepository::lockByEmail);
        if (found.isPresent() && found.get().isLockedAt(now)) {
            throw new LogInRefusedException(LOCKED);
        }
        // Every refusal below runs one BCrypt check, so none of them answers faster than another
        String hash = found.map(User::getPasswordHash).orElse(unknownUserHash);
        boolean matches = passwordEncoder.matches(password == null ? "" : password, hash == null ? unknownUserHash : hash);
        if (found.isEmpty()) {
            throw new LogInRefusedException(WRONG_CREDENTIALS);
        }
        User user = found.get();
        if (!matches || user.getPasswordHash() == null) {
            user.recordFailedLogIn(now);
            throw new LogInRefusedException(user.isLockedAt(now) ? LOCKED : WRONG_CREDENTIALS);
        }
        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new LogInRefusedException(user instanceof Recruiter recruiter
                    ? requestStatus(recruiter) : "This account is not active yet.");
        }
        user.recordLogIn();
        return new LoggedIn(token(user, now), user);
    }

    // For an account that has just proved who it is another way: UC-02 logs the new Applicant in
    public LoggedIn startSession(User user) {
        return new LoggedIn(token(user, clock.instant()), user);
    }

    @Transactional(readOnly = true)
    public User currentUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new LogInRefusedException("This account no longer exists."));
    }

    private String token(User user, Instant now) {
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(user.getEmail())
                .issuedAt(now)
                .expiresAt(now.plus(SESSION_LENGTH))
                .claim(ROLE_CLAIM, Role.of(user).name())
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    // UC-08 extension *a: the password was right, so the pending recruiter learns where the request stands (BR-14)
    private String requestStatus(Recruiter recruiter) {
        if (!recruiter.isEmailVerified()) {
            return "Confirm your email first: open the link we sent to " + recruiter.getEmail() + ".";
        }
        List<OrganizationMembership> requests =
                membershipRepository.findByRecruiterOrderByRequestedAtAscMembershipIdAsc(recruiter);
        Optional<OrganizationMembership> latest = requests.stream()
                .max(Comparator.comparing(OrganizationMembership::getRequestedAt));
        MembershipStatus status = latest.map(OrganizationMembership::getStatus).orElse(MembershipStatus.PENDING);
        return switch (status) {
            case INFORMATION_REQUESTED -> "Your request is under review. The administrator asked for more "
                    + "information by email: " + latest.get().getDecisionNote();
            case DENIED -> "Your request was denied: " + latest.get().getDecisionNote() + " Your account stays inactive.";
            default -> "Your request is under review. The decision will arrive by email. "
                    + "Until it is approved you cannot use recruiter functions.";
        };
    }

}
