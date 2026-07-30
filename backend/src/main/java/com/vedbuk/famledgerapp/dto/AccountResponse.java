package com.vedbuk.famledgerapp.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AccountResponse {
    private Long id;
    private Long ownerId;
    private String ownerName;
    private Long householdId;
    private String name;
    private String type;            // "BANK", "CASH", "SAVINGS", "CREDIT"
    private String currency;        // e.g., "INR"
    private BigDecimal currentBalance;
    private OffsetDateTime createdAt;
}