package baylor.csi5324.careerbridge.controller;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class VersionControllerTest {

    @Test
    void versionReturnsTheRunningCommit() {
        VersionController controller = new VersionController("abc123");

        assertEquals(Map.of("commit", "abc123"), controller.version());
    }
}
