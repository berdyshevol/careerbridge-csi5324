package baylor.csi5324.careerbridge.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

// On PostgreSQL Hibernate guards an enum column with a check listing the values it knew when it created the
// table, and ddl-auto=update never widens it. A value added later, like PASSWORD_RESET (SCRUM-232), would be
// refused on the live database, so the stale check is dropped; Java's enum already limits the values
@Component
@Order(0)
public class EnumColumnChecks implements CommandLineRunner {

    private final DataSource dataSource;

    public EnumColumnChecks(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(String... args) throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            if (!connection.getMetaData().getDatabaseProductName().equals("PostgreSQL")) {
                return;
            }
            try (Statement statement = connection.createStatement()) {
                statement.execute("ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check");
            }
        }
    }
}
