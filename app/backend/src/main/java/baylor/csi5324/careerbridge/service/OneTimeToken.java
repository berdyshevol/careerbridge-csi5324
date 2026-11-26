package baylor.csi5324.careerbridge.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

// A link that works once: the user gets the token, the database keeps only its hash, so a copy of the
// database opens no account (UC-08 verification, Log In password reset)
record OneTimeToken(String token, String hash) {

    private static final SecureRandom RANDOM = new SecureRandom();

    static OneTimeToken create() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        return new OneTimeToken(token, hash(token));
    }

    static String hash(String token) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
