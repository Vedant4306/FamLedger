package com.vedbuk.famledgerapp.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsSummaryResponse {
    // 1. Core Financial Metrics
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal netSavings;
    private Double savingsRatePercentage;
    private BigDecimal dailyAverageSpend;
    private Double momChangePercentage; // Month-over-Month change %

    // 2. Breakdown Maps
    private Map<String, BigDecimal> categoryExpenses;
    private Map<String, BigDecimal> accountExpenses;

    // 3. Family Member Breakdown (For Household View)
    private List<MemberSpendSummary> memberSpends;

    // 4. Smart Insight Alerts
    private List<String> smartInsights;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MemberSpendSummary {
        private Long userId;
        private String memberName;
        private String role;
        private BigDecimal totalSpent;
        private String topCategory;
    }
}