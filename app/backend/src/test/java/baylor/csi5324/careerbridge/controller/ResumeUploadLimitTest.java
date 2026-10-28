package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.service.ApplicantProfileService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;

import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

// UC-03 extension 6a past the multipart limit, which only a running server has: the applicant gets
// the reason, not a 500 or a reset connection
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ResumeUploadLimitTest {

    private static final String BOUNDARY = "careerbridge-boundary";

    @LocalServerPort
    private int port;

    private final HttpClient client = HttpClient.newHttpClient();

    @Test
    void aFileOverTheLimitGetsTheReasonInPlainText() throws Exception {
        HttpResponse<String> answer = client.send(HttpRequest.newBuilder(uri("/api/applicant/resume"))
                .header("Authorization", "Bearer " + applicantToken())
                .header("Content-Type", "multipart/form-data; boundary=" + BOUNDARY)
                .POST(HttpRequest.BodyPublishers.ofByteArray(multipart("big.pdf", 8 * 1024 * 1024)))
                .build(), HttpResponse.BodyHandlers.ofString());

        assertEquals(HttpStatus.BAD_REQUEST.value(), answer.statusCode());
        assertTrue(answer.headers().firstValue("Content-Type").orElse("").startsWith("text/plain"));
        assertEquals(ApplicantProfileService.RESUME_TOO_LARGE, answer.body());
    }

    private String applicantToken() throws Exception {
        HttpResponse<String> answer = client.send(HttpRequest.newBuilder(uri("/api/auth/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(
                        "{\"email\": \"sam.rivera@example.com\", \"password\": \"Applicant-test-2\"}"))
                .build(), HttpResponse.BodyHandlers.ofString());
        Matcher token = Pattern.compile("\"token\"\\s*:\\s*\"([^\"]+)\"").matcher(answer.body());
        assertTrue(token.find(), answer.body());
        return token.group(1);
    }

    private URI uri(String path) {
        return URI.create("http://localhost:" + port + path);
    }

    private static byte[] multipart(String fileName, int size) {
        ByteArrayOutputStream body = new ByteArrayOutputStream();
        body.writeBytes(("--" + BOUNDARY + "\r\nContent-Disposition: form-data; name=\"file\"; filename=\"" + fileName
                + "\"\r\nContent-Type: application/pdf\r\n\r\n%PDF-1.4\n").getBytes(StandardCharsets.US_ASCII));
        body.writeBytes(new byte[size]);
        body.writeBytes(("\r\n--" + BOUNDARY + "--\r\n").getBytes(StandardCharsets.US_ASCII));
        return body.toByteArray();
    }
}
