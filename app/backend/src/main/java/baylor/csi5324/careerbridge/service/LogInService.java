package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.Role;
import baylor.csi5324.careerbridge.model.User;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

// Starts a session: a token signed by the backend with the account's role (ADR-0010). Register
// (UC-02) is its only caller so far; Log In will check credentials and call it too.
@Service
public class LogInService {

    private static final Duration SESSION_LENGTH = Duration.ofHours(8);
    public static final String ROLE_CLAIM = "role";

    private final JwtEncoder jwtEncoder;
    private final Clock clock;

    public LogInService(JwtEncoder jwtEncoder, Clock clock) {
        this.jwtEncoder = jwtEncoder;
        this.clock = clock;
    }

    // For an account that has just proved who it is another way: UC-02 logs the new Applicant in
    public LoggedIn startSession(User user) {
        Instant now = clock.instant();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(user.getEmail())
                .issuedAt(now)
                .expiresAt(now.plus(SESSION_LENGTH))
                .claim(ROLE_CLAIM, Role.of(user).name())
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return new LoggedIn(jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue(), user);
    }
}
