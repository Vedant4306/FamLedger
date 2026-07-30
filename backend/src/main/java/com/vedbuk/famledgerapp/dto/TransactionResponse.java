package com.vedbuk.famledgerapp.dto;

import lombok.*;
import com.vedbuk.famledgerapp.Entity.Household;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TransactionResponse {
    private Long id;
    private Long accountId;
    private String accountName;
    private Long householdId;
    private String householdName;
    private Long transferAccountId;
    private String transferAccountName;
    private BigDecimal amount;
    private String type;
    private String category;
    private String description;
    private OffsetDateTime transactionDate;
    private OffsetDateTime createdAt;
    private Long userId;
    private String userName;

}