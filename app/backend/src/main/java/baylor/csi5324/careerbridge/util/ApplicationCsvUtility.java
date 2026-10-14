package baylor.csi5324.careerbridge.util;

import baylor.csi5324.careerbridge.model.ApplicationStatus;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// Utility class for CSV data modeling of applications (import/export and parsing)
public final class ApplicationCsvUtility {

    public static final String HEADER = "applicantEmail,jobTitle,organizationName,dateApplied,status,resumeFileName";

    private ApplicationCsvUtility() {
    }

    public static List<Map<String, String>> parse(String csvText) {
        if (csvText == null || csvText.isBlank()) {
            return List.of();
        }
        List<Map<String, String>> records = new ArrayList<>();
        String[] lines = csvText.split("\\r?\\n");
        if (lines.length <= 1) {
            return List.of();
        }

        String[] headers = parseLine(lines[0]);
        for (int i = 1; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.isEmpty() || line.startsWith("#")) {
                continue;
            }
            String[] values = parseLine(line);
            Map<String, String> record = new HashMap<>();
            for (int h = 0; h < headers.length; h++) {
                String val = h < values.length ? values[h].trim() : "";
                record.put(headers[h].trim(), val);
            }
            records.add(record);
        }
        return records;
    }

    public static String toCsv(List<Map<String, String>> records) {
        StringBuilder sb = new StringBuilder();
        sb.append(HEADER).append("\n");
        for (Map<String, String> record : records) {
            sb.append(escape(record.getOrDefault("applicantEmail", ""))).append(",")
                    .append(escape(record.getOrDefault("jobTitle", ""))).append(",")
                    .append(escape(record.getOrDefault("organizationName", ""))).append(",")
                    .append(escape(record.getOrDefault("dateApplied", LocalDate.now().toString()))).append(",")
                    .append(escape(record.getOrDefault("status", ApplicationStatus.APPLIED.name()))).append(",")
                    .append(escape(record.getOrDefault("resumeFileName", "resume.pdf")))
                    .append("\n");
        }
        return sb.toString();
    }

    private static String[] parseLine(String line) {
        List<String> tokens = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                tokens.add(current.toString().trim());
                current.setLength(0);
            } else {
                current.append(c);
            }
        }
        tokens.add(current.toString().trim());
        return tokens.toArray(new String[0]);
    }

    private static String escape(String value) {
        if (value == null) {
            return "";
        }
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
