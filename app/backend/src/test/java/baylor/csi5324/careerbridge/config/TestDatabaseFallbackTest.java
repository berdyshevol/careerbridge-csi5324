package baylor.csi5324.careerbridge.config;

import org.apache.commons.logging.LogFactory;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import java.util.function.BooleanSupplier;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.fail;

class TestDatabaseFallbackTest {

    private static final String TESTCONTAINERS_URL = "jdbc:tc:postgresql:18-alpine:///careerbridge?TC_DAEMON=true";

    @Test
    void withoutDockerTheTestsUseH2() {
        MockEnvironment environment = withUrl(TESTCONTAINERS_URL);

        fallback(() -> false).postProcessEnvironment(environment, null);

        assertEquals(TestDatabaseFallback.H2_URL, environment.getProperty("spring.datasource.url"));
        assertEquals("sa", environment.getProperty("spring.datasource.username"));
        assertEquals("", environment.getProperty("spring.datasource.password"));
    }

    @Test
    void withDockerTheTestsKeepPostgresql() {
        MockEnvironment environment = withUrl(TESTCONTAINERS_URL);

        fallback(() -> true).postProcessEnvironment(environment, null);

        assertEquals(TESTCONTAINERS_URL, environment.getProperty("spring.datasource.url"));
        assertEquals("test", environment.getProperty("spring.datasource.username"));
    }

    @Test
    void inCiAMissingDockerFailsTheRunInsteadOfFallingBack() {
        MockEnvironment environment = withUrl(TESTCONTAINERS_URL).withProperty("CI", "true");

        fallback(() -> false).postProcessEnvironment(environment, null);

        assertEquals(TESTCONTAINERS_URL, environment.getProperty("spring.datasource.url"));
    }

    @Test
    void aDatabaseSetByHandIsLeftAloneWithoutAskingForDocker() {
        MockEnvironment environment = withUrl("jdbc:postgresql://localhost/careerbridge");

        fallback(() -> fail("Docker was checked")).postProcessEnvironment(environment, null);

        assertEquals("jdbc:postgresql://localhost/careerbridge", environment.getProperty("spring.datasource.url"));
    }

    private static MockEnvironment withUrl(String url) {
        return new MockEnvironment()
                .withProperty("spring.datasource.url", url)
                .withProperty("spring.datasource.username", "test")
                .withProperty("spring.datasource.password", "test");
    }

    private static TestDatabaseFallback fallback(BooleanSupplier docker) {
        return new TestDatabaseFallback(LogFactory.getLog(TestDatabaseFallbackTest.class), docker);
    }
}
