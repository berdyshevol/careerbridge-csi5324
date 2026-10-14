package baylor.csi5324.careerbridge.util;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ApplicationCsvUtilityTest {

    private static final String SAMPLE_CSV = """
            applicantEmail,jobTitle,organizationName,dateApplied,status,resumeFileName
            alice@example.com,Backend Dev,Acme Corp,2026-10-10,APPLIED,alice_cv.pdf
            bob@example.com,Frontend Dev,Initech,2026-10-11,SCREENING,bob_cv.pdf
            """;

    @Test
    void parseExtractsRecordsWithHeaders() {
        List<Map<String, String>> records = ApplicationCsvUtility.parse(SAMPLE_CSV);

        assertEquals(2, records.size());
        assertEquals("alice@example.com", records.get(0).get("applicantEmail"));
        assertEquals("Backend Dev", records.get(0).get("jobTitle"));
        assertEquals("Acme Corp", records.get(0).get("organizationName"));
        assertEquals("APPLIED", records.get(0).get("status"));
        assertEquals("alice_cv.pdf", records.get(0).get("resumeFileName"));

        assertEquals("bob@example.com", records.get(1).get("applicantEmail"));
        assertEquals("bob_cv.pdf", records.get(1).get("resumeFileName"));
    }

    @Test
    void toCsvSerializesRecordsWithHeader() {
        List<Map<String, String>> records = List.of(
                Map.of(
                        "applicantEmail", "grace@example.com",
                        "jobTitle", "Systems Architect",
                        "organizationName", "Baylor Corp",
                        "dateApplied", "2026-10-13",
                        "status", "APPLIED",
                        "resumeFileName", "grace.pdf"
                )
        );

        String csv = ApplicationCsvUtility.toCsv(records);

        assertTrue(csv.startsWith(ApplicationCsvUtility.HEADER));
        assertTrue(csv.contains("grace@example.com"));
        assertTrue(csv.contains("Systems Architect"));
        assertTrue(csv.contains("grace.pdf"));
    }

    @Test
    void parseHandlesEmptyOrBlankInputGracefully() {
        assertTrue(ApplicationCsvUtility.parse("").isEmpty());
        assertTrue(ApplicationCsvUtility.parse(null).isEmpty());
        assertTrue(ApplicationCsvUtility.parse("headerOnly").isEmpty());
    }
}
