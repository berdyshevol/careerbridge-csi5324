package baylor.csi5324.careerbridge.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;

// ADR-0010: the backend both issues and checks the tokens, so one shared secret is enough
@Configuration
public class TokenConfig {

    private static final Logger log = LoggerFactory.getLogger(TokenConfig.class);
    private static final int MINIMUM_SECRET_BYTES = 32; // HS256 needs a 256-bit key

    private final SecretKey key;

    public TokenConfig(@Value("${careerbridge.jwt.secret}") String secret) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < MINIMUM_SECRET_BYTES) {
            // Without a configured secret every restart logs everybody out, which is fine on a laptop
            log.warn("JWT_SECRET is missing or shorter than {} bytes; using a random key until restart",
                    MINIMUM_SECRET_BYTES);
            bytes = new byte[MINIMUM_SECRET_BYTES];
            new SecureRandom().nextBytes(bytes);
        }
        this.key = new SecretKeySpec(bytes, "HmacSHA256");
    }

    @Bean
    JwtEncoder jwtEncoder() {
        return new NimbusJwtEncoder(new ImmutableSecret<>(key));
    }

    @Bean
    JwtDecoder jwtDecoder() {
        return NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
    }
}
