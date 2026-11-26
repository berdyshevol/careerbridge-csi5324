package baylor.csi5324.careerbridge.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.FileSystemResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ScriptUtils;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * ADR-0014: ddl-auto=validate checks tables, columns and types, but not constraints, so a value added to an
 * enum without a migration would only fail on the live database. This builds the schema Hibernate derives
 * from the entities (written at startup by the test configuration) next to the one the migrations built,
 * and compares the two.
 */
@SpringBootTest
class MigrationsMatchEntitiesTest {

    private static final String SCRIPT = "target/entities-schema.sql";
    private static final String ENTITIES = "entities_schema";

    private static final String COLUMNS = """
            select table_name || '.' || column_name || ' ' || data_type || coalesce('(' || character_maximum_length || ')', '')
                   || case is_nullable when 'NO' then ' not null' else '' end
            from information_schema.columns
            where table_schema = ? and table_name <> 'flyway_schema_history'""";

    // Names are left out: PostgreSQL and Hibernate name them, and a renamed constraint is not a different rule
    private static final String CONSTRAINTS = """
            select c.relname || ' ' || pg_get_constraintdef(k.oid)
            from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = ? and c.relname <> 'flyway_schema_history'""";

    private static final String SEQUENCES = "select sequence_name from information_schema.sequences where sequence_schema = ?";

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void theMigrationsBuildTheSchemaTheEntitiesDescribe() throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            assumeTrue(connection.getMetaData().getDatabaseProductName().equals("PostgreSQL"),
                    "Only PostgreSQL is compared; CI runs it on every pull request");
        }
        jdbc.execute("drop schema if exists " + ENTITIES + " cascade");
        jdbc.execute("create schema " + ENTITIES);
        try {
            buildFromEntities();
            List<String> differences = new ArrayList<>();
            for (String query : List.of(COLUMNS, CONSTRAINTS, SEQUENCES)) {
                // The fully qualified names in the foreign keys differ only by schema
                Set<String> fromEntities = rows(query, ENTITIES, ENTITIES + ".");
                Set<String> fromMigrations = rows(query, "public", "public.");
                fromEntities.stream().filter(row -> !fromMigrations.contains(row))
                        .forEach(row -> differences.add("entities only:   " + row));
                fromMigrations.stream().filter(row -> !fromEntities.contains(row))
                        .forEach(row -> differences.add("migrations only: " + row));
            }
            assertTrue(differences.isEmpty(), """
                    The migrations in src/main/resources/db/migration/ do not build the schema the entities \
                    describe. Add a migration V<next>__<what>.sql that changes the database the way the \
                    entities changed (ADR-0014):
                    """ + String.join("\n", differences));
        } finally {
            jdbc.execute("drop schema " + ENTITIES + " cascade");
        }
    }

    private void buildFromEntities() throws Exception {
        try (Connection connection = dataSource.getConnection(); Statement statement = connection.createStatement()) {
            statement.execute("set search_path to " + ENTITIES);
            try {
                ScriptUtils.executeSqlScript(connection, new FileSystemResource(SCRIPT));
            } finally {
                statement.execute("set search_path to public");
            }
        }
    }

    private Set<String> rows(String query, String schema, String qualifier) {
        return new TreeSet<>(jdbc.queryForList(query, String.class, schema).stream()
                .map(row -> row.replace(qualifier, ""))
                .toList());
    }
}
