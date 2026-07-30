package com.vedbuk.famledgerapp.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TransactionRequest {
    private Long accountId;
    private Long transferAccountId; // Optional: Required only if type == 'TRANSFER'
    private Long householdId;
    private BigDecimal amount;
    private String type; // 'INCOME', 'EXPENSE', 'TRANSFER'
    private String category; // Standard or custom text!
    private String description;
    private OffsetDateTime transactionDate;
}