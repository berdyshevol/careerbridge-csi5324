package baylor.csi5324.careerbridge.util;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CsvReaderTest {

    @Test
    void parsesRowsKeyedByHeader() {
        List<Map<String, String>> records = CsvReader.parse("title,location\nEngineer,Remote\nAnalyst,Hybrid\n");

        assertEquals(2, records.size());
        assertEquals("Engineer", records.get(0).get("title"));
        assertEquals("Hybrid", records.get(1).get("location"));
    }

    @Test
    void keepsCommasAndQuotesInsideQuotedFields() {
        List<Map<String, String>> records = CsvReader.parse("title,salaryRange\n\"Say \"\"hi\"\"\",\"$65,000 - $80,000\"\n");

        assertEquals("Say \"hi\"", records.get(0).get("title"));
        assertEquals("$65,000 - $80,000", records.get(0).get("salaryRange"));
    }

    @Test
    void fillsMissingTrailingFieldsWithEmptyText() {
        List<Map<String, String>> records = CsvReader.parse("title,salaryRange\nEngineer\n");

        assertEquals("", records.get(0).get("salaryRange"));
    }

    @Test
    void returnsNothingForEmptyText() {
        assertTrue(CsvReader.parse("").isEmpty());
    }
}
