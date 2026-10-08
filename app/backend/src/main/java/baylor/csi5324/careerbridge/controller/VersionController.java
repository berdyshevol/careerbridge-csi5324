package baylor.csi5324.careerbridge.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Tells which commit is running. The Deploy workflow reads it to see
 * whether the new version went live.
 */
@RestController
@RequestMapping("/api/version")
public class VersionController {

    private final String commit;

    public VersionController(@Value("${careerbridge.commit}") String commit) {
        this.commit = commit;
    }

    @GetMapping
    public Map<String, String> version() {
        return Map.of("commit", commit);
    }
}
