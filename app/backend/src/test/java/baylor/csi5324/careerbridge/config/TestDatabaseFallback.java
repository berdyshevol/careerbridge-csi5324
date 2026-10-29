package baylor.csi5324.careerbridge.config;

import org.apache.commons.logging.Log;
import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.logging.DeferredLogFactory;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.testcontainers.DockerClientFactory;

import java.util.Map;
import java.util.function.BooleanSupplier;

/**
 * ADR-0009: the tests run on PostgreSQL in Docker. A member without Docker running still gets
 * them on an in-memory H2, and CI, which has Docker, checks PostgreSQL before every merge.
 * Registered in {@code META-INF/spring.factories}, so it also covers the backend the
 * end-to-end tests start with {@code spring-boot:test-run}.
 */
public class TestDatabaseFallback implements EnvironmentPostProcessor {

    static final String H2_URL = "jdbc:h2:mem:careerbridge-test;DB_CLOSE_DELAY=-1";

    // Every test context asks; without Docker each failed probe would cost seconds again
    private static Boolean dockerAvailable;

    private final Log log;
    private final BooleanSupplier docker;

    public TestDatabaseFallback(DeferredLogFactory logFactory) {
        this(logFactory.getLog(TestDatabaseFallback.class), TestDatabaseFallback::isDockerAvailable);
    }

    TestDatabaseFallback(Log log, BooleanSupplier docker) {
        this.log = log;
        this.docker = docker;
    }

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        // A URL set by hand is not the Testcontainers one and is left alone
        String url = environment.getProperty("spring.datasource.url", "");
        if (!url.startsWith("jdbc:tc:") || docker.getAsBoolean()) {
            return;
        }
        log.warn("Docker is not running, so the tests use an in-memory H2 database. "
                + "CI runs them on PostgreSQL before a merge.");
        environment.getPropertySources().addFirst(new MapPropertySource("h2WithoutDocker", Map.of(
                "spring.datasource.url", H2_URL,
                "spring.datasource.username", "sa",
                "spring.datasource.password", "")));
    }

    private static synchronized boolean isDockerAvailable() {
        if (dockerAvailable == null) {
            dockerAvailable = DockerClientFactory.instance().isDockerAvailable();
        }
        return dockerAvailable;
    }
}
