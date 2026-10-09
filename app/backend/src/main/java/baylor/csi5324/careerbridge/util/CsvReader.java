package baylor.csi5324.careerbridge.util;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class CsvReader {

    private CsvReader() {
    }

    public static List<Map<String, String>> parse(String text) {
        List<List<String>> rows = new ArrayList<>();
        List<String> row = new ArrayList<>();
        StringBuilder field = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (inQuotes) {
                if (c == '"' && i + 1 < text.length() && text.charAt(i + 1) == '"') {
                    field.append('"');
                    i++;
                } else if (c == '"') {
                    inQuotes = false;
                } else {
                    field.append(c);
                }
            } else if (c == '"') {
                inQuotes = true;
            } else if (c == ',') {
                row.add(field.toString());
                field.setLength(0);
            } else if (c == '\n') {
                row.add(field.toString());
                field.setLength(0);
                rows.add(row);
                row = new ArrayList<>();
            } else if (c != '\r') {
                field.append(c);
            }
        }
        if (field.length() > 0 || !row.isEmpty()) {
            row.add(field.toString());
            rows.add(row);
        }
        rows.removeIf(r -> r.stream().allMatch(String::isEmpty));

        List<Map<String, String>> records = new ArrayList<>();
        if (rows.isEmpty()) {
            return records;
        }
        List<String> header = rows.get(0);
        for (List<String> values : rows.subList(1, rows.size())) {
            Map<String, String> record = new LinkedHashMap<>();
            for (int i = 0; i < header.size(); i++) {
                record.put(header.get(i), i < values.size() ? values.get(i) : "");
            }
            records.add(record);
        }
        return records;
    }
}
