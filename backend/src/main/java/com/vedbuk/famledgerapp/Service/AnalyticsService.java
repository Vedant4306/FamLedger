package com.vedbuk.famledgerapp.Service;

import com.vedbuk.famledgerapp.Entity.HouseholdMembership;
import com.vedbuk.famledgerapp.Entity.Transaction;
import com.vedbuk.famledgerapp.Repository.HouseholdMembershipRepository;
import com.vedbuk.famledgerapp.Repository.TransactionRepository;
import com.vedbuk.famledgerapp.dto.AnalyticsSummaryResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final TransactionRepository transactionRepository;
    private final HouseholdMembershipRepository membershipRepository;

    public AnalyticsService(TransactionRepository transactionRepository,
                            HouseholdMembershipRepository membershipRepository) {
        this.transactionRepository = transactionRepository;
        this.membershipRepository = membershipRepository;
    }

    @Transactional(readOnly = true)
    public AnalyticsSummaryResponse getAnalytics(Long userId, String scope, String period, LocalDate customStart, LocalDate customEnd) {
        LocalDate now = LocalDate.now();
        OffsetDateTime startDateTime;
        OffsetDateTime endDateTime = now.atTime(LocalTime.MAX).atOffset(ZoneOffset.UTC);

        // 1. Determine Date Range
        switch (period.toUpperCase()) {
            case "DAILY":
                startDateTime = now.atStartOfDay().atOffset(ZoneOffset.UTC);
                break;
            case "WEEKLY":
                startDateTime = now.minusDays(7).atStartOfDay().atOffset(ZoneOffset.UTC);
                break;
            case "YEARLY":
                startDateTime = now.with(TemporalAdjusters.firstDayOfYear()).atStartOfDay().atOffset(ZoneOffset.UTC);
                break;
            case "ALL":
                startDateTime = OffsetDateTime.of(2020, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC);
                break;
            case "CUSTOM":
                startDateTime = (customStart != null ? customStart : now.with(TemporalAdjusters.firstDayOfMonth())).atStartOfDay().atOffset(ZoneOffset.UTC);
                if (customEnd != null) {
                    endDateTime = customEnd.atTime(LocalTime.MAX).atOffset(ZoneOffset.UTC);
                }
                break;
            case "MONTHLY":
            default:
                startDateTime = now.with(TemporalAdjusters.firstDayOfMonth()).atStartOfDay().atOffset(ZoneOffset.UTC);
                break;
        }

        List<Transaction> sourceTxs;
        List<HouseholdMembership> householdMemberships = new ArrayList<>();
        boolean isHouseholdScope = "HOUSEHOLD".equalsIgnoreCase(scope);

        // 2. Fetch Household Data if scope is HOUSEHOLD
        if (isHouseholdScope) {
            List<HouseholdMembership> userMemberships = membershipRepository.findByUserId(userId);
            if (!userMemberships.isEmpty()) {
                Long householdId = userMemberships.get(0).getHousehold().getId();
                sourceTxs = transactionRepository.findByHouseholdId(householdId);
                householdMemberships = membershipRepository.findByHouseholdId(householdId);
            } else {
                sourceTxs = transactionRepository.findByUserId(userId);
            }
        } else {
            sourceTxs = transactionRepository.findByUserId(userId);
        }

        // 3. Filter Transactions strictly within Date Range
        OffsetDateTime finalEndDateTime = endDateTime;
        List<Transaction> filteredTxs = sourceTxs.stream()
                .filter(tx -> tx.getTransactionDate() != null &&
                        !tx.getTransactionDate().isBefore(startDateTime) &&
                        !tx.getTransactionDate().isAfter(finalEndDateTime))
                .collect(Collectors.toList());

        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;
        Map<String, BigDecimal> categoryExpenses = new HashMap<>();
        Map<String, BigDecimal> accountExpenses = new HashMap<>();
        Map<Long, BigDecimal> memberSpentMap = new HashMap<>();
        Map<Long, Map<String, BigDecimal>> memberCategoryMap = new HashMap<>();

        // 4. Process Transactions
        for (Transaction tx : filteredTxs) {
            BigDecimal amount = tx.getAmount() != null ? tx.getAmount() : BigDecimal.ZERO;

            if ("INCOME".equalsIgnoreCase(tx.getType())) {
                totalIncome = totalIncome.add(amount);
            } else if ("EXPENSE".equalsIgnoreCase(tx.getType())) {
                totalExpense = totalExpense.add(amount);

                // Category Breakdown
                String category = tx.getCategory() != null ? tx.getCategory() : "General";
                categoryExpenses.put(category, categoryExpenses.getOrDefault(category, BigDecimal.ZERO).add(amount));

                // Account Breakdown
                String accountName = tx.getAccount() != null ? tx.getAccount().getName() : "Cash / Wallet";
                accountExpenses.put(accountName, accountExpenses.getOrDefault(accountName, BigDecimal.ZERO).add(amount));

                // Member Breakdown Tracking
                Long ownerId = null;
                if (tx.getUser() != null) {
                    ownerId = tx.getUser().getId();
                }

                if (ownerId != null) {
                    memberSpentMap.put(ownerId, memberSpentMap.getOrDefault(ownerId, BigDecimal.ZERO).add(amount));
                    Map<String, BigDecimal> catMap = memberCategoryMap.computeIfAbsent(ownerId, k -> new HashMap<>());
                    catMap.put(category, catMap.getOrDefault(category, BigDecimal.ZERO).add(amount));
                }
            }
        }

        BigDecimal netSavings = totalIncome.subtract(totalExpense);

        // Savings Rate
        Double savingsRate = 0.0;
        if (totalIncome.compareTo(BigDecimal.ZERO) > 0) {
            savingsRate = netSavings.divide(totalIncome, 4, RoundingMode.HALF_UP).doubleValue() * 100;
        }

        // Daily Average Spend
        long daysBetween = Math.max(1, ChronoUnit.DAYS.between(startDateTime.toLocalDate(), endDateTime.toLocalDate()) + 1);
        BigDecimal dailyAverage = totalExpense.divide(BigDecimal.valueOf(daysBetween), 2, RoundingMode.HALF_UP);

        // 5. Populate Member Breakdown Summaries (Parents & Children)
        List<AnalyticsSummaryResponse.MemberSpendSummary> memberSpends = new ArrayList<>();

        if (isHouseholdScope && !householdMemberships.isEmpty()) {
            for (HouseholdMembership m : householdMemberships) {
                Long mUserId = m.getUser().getId();
                BigDecimal mSpent = memberSpentMap.getOrDefault(mUserId, BigDecimal.ZERO);

                Map<String, BigDecimal> catMap = memberCategoryMap.get(mUserId);
                String topCategory = "None";
                if (catMap != null && !catMap.isEmpty()) {
                    topCategory = catMap.entrySet().stream()
                            .max(Map.Entry.comparingByValue())
                            .map(Map.Entry::getKey)
                            .orElse("None");
                }

                memberSpends.add(new AnalyticsSummaryResponse.MemberSpendSummary(
                        mUserId,
                        m.getUser().getFullName(),
                        m.getRole() != null ? m.getRole().toUpperCase() : "MEMBER",
                        mSpent,
                        topCategory
                ));
            }
        }

        // Generate Smart Insights
        List<String> insights = generateInsights(totalIncome, totalExpense, savingsRate, categoryExpenses, isHouseholdScope);

        return new AnalyticsSummaryResponse(
                totalIncome,
                totalExpense,
                netSavings,
                savingsRate,
                dailyAverage,
                0.0,
                categoryExpenses,
                accountExpenses,
                memberSpends,
                insights
        );
    }

    private List<String> generateInsights(BigDecimal income, BigDecimal expense, Double savingsRate, Map<String, BigDecimal> categories, boolean isHousehold) {
        List<String> list = new ArrayList<>();

        if (isHousehold) {
            list.add("👨‍👩‍👧 Family Mode Active: Showing aggregate transactions and spending profiles for all household members.");
        }

        if (savingsRate >= 20.0) {
            list.add(String.format("🎉 Excellent savings rate! You saved %.1f%% of income in this period.", savingsRate));
        } else if (expense.compareTo(income) > 0 && income.compareTo(BigDecimal.ZERO) > 0) {
            list.add("⚠️ High Alert: Expenses exceeded overall income during this period!");
        }

        if (!categories.isEmpty()) {
            Map.Entry<String, BigDecimal> topCategory = categories.entrySet().stream()
                    .max(Map.Entry.comparingByValue()).get();
            list.add(String.format("💡 Highest Spending Category: '%s' (₹%.2f).", topCategory.getKey(), topCategory.getValue()));
        }

        return list;
    }
}