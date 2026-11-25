package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.Application;

import java.util.List;

// CO-06.1: posting details, stage, finality warning (A5) and reason list (A18)
public record WithdrawalPrompt(Application application, String warning, List<String> reasons) {

    public static final String WARNING =
            "Withdrawing this application is final. You cannot reapply to this posting.";

    public static final List<String> REASONS = List.of(
            "Accepted another offer",
            "No longer interested",
            "Other");
}

