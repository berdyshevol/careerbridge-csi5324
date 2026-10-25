package baylor.csi5324.careerbridge.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

// ADR-0006 lets every read through on the public site, so a read that writes
// would change data there. Found by asking Spring for the endpoints, so a new
// one is checked without anyone remembering to add it here.
@SpringBootTest
// A demo account, so that /api/auth/me finds its user
@WithMockUser(username = "admin@careerbridge.example", roles = "ADMIN")
class ReadsChangeNothingTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private RequestMappingHandlerMapping handlerMapping;

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void everyReadUnderApiLeavesTheDatabaseAsItWas() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        List<String> reads = handlerMapping.getHandlerMethods().keySet().stream()
                // A mapping without a method answers GET too
                .filter(info -> info.getMethodsCondition().getMethods().isEmpty()
                        || info.getMethodsCondition().getMethods().contains(RequestMethod.GET))
                .flatMap(info -> info.getPatternValues().stream())
                .filter(pattern -> pattern.startsWith("/api/"))
                .map(pattern -> pattern.replaceAll("\\{[^}]+}", "1"))
                .toList();
        assertFalse(reads.isEmpty());

        var before = everyTable();
        for (String read : reads) {
            // A refused read never reaches the code that could write
            int status = mockMvc.perform(get(read)).andReturn().getResponse().getStatus();
            assertTrue(status < 400, "GET " + read + " answered " + status
                    + ": give this test a request that reaches the handler");
            var after = everyTable();
            for (String table : before.keySet()) {
                assertEquals(before.get(table), after.get(table), "GET " + read + " changed " + table);
            }
            before = after;
        }
    }

    private Map<String, List<Map<String, Object>>> everyTable() {
        Map<String, List<Map<String, Object>>> tables = new HashMap<>();
        // PostgreSQL names the schema in lower case, H2 in upper case
        for (String table : jdbc.queryForList("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES "
                + "WHERE LOWER(TABLE_SCHEMA) = 'public' AND TABLE_TYPE = 'BASE TABLE'", String.class)) {
            tables.put(table, jdbc.queryForList("SELECT * FROM \"" + table + "\" ORDER BY 1"));
        }
        assertFalse(tables.isEmpty(), "found no tables to compare");
        return tables;
    }
}
