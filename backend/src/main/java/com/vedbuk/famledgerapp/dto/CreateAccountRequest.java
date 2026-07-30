package com.vedbuk.famledgerapp.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateAccountRequest {
    private String name;
    private String type;             // "BANK", "CASH", "SAVINGS", "CREDIT"
    private String currency;         // "INR"
    private BigDecimal initialBalance;
}