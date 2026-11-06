package baylor.csi5324.careerbridge.controller.dto;

import java.time.LocalDate;

public record AcceptOfferRequest(String expectedSalary, LocalDate expectedExpirationDate) {
}

