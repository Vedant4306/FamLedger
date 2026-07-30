import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, G } from "react-native-svg";
import apiClient from "../../src/api/client";

interface MemberSpend {
  userId: number;
  memberName: string;
  role: string;
  totalSpent: number;
  topCategory: string;
}

interface AnalyticsData {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRatePercentage: number;
  dailyAverageSpend: number;
  categoryExpenses: Record<string, number>;
  accountExpenses: Record<string, number>;
  memberSpends: MemberSpend[];
  smartInsights: string[];
}

type PeriodType = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "ALL" | "CUSTOM";
type ScopeType = "PERSONAL" | "HOUSEHOLD";

const PIE_COLORS = [
  "#007AFF",
  "#FF9500",
  "#34C759",
  "#AF52DE",
  "#FF2D55",
  "#5856D6",
  "#FFCC00",
  "#00C7BE",
];

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  // Scope & Time States
  const [selectedScope, setSelectedScope] = useState<ScopeType>("PERSONAL");
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("MONTHLY");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchAnalytics = async (
    scope = selectedScope,
    period = selectedPeriod,
    customStart = startDate,
    customEnd = endDate,
  ) => {
    try {
      let url = `/analytics/summary?scope=${scope}&period=${period}`;
      if (period === "CUSTOM") {
        if (customStart) url += `&startDate=${customStart}`;
        if (customEnd) url += `&endDate=${customEnd}`;
      }

      const response = await apiClient.get(url);
      setAnalytics(response.data);
    } catch (error: any) {
      console.error(
        "Failed to fetch analytics:",
        error?.response?.data || error.message,
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAnalytics(selectedScope, selectedPeriod, startDate, endDate);
    }, [selectedScope, selectedPeriod]),
  );

  const handleScopeChange = (scope: ScopeType) => {
    setSelectedScope(scope);
    setLoading(true);
    fetchAnalytics(scope, selectedPeriod, startDate, endDate);
  };

  const handlePeriodChange = (period: PeriodType) => {
    setSelectedPeriod(period);
    setLoading(true);
    fetchAnalytics(selectedScope, period, startDate, endDate);
  };

  const handleApplyCustomDates = () => {
    setLoading(true);
    fetchAnalytics(selectedScope, "CUSTOM", startDate, endDate);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics(selectedScope, selectedPeriod, startDate, endDate);
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  const totalExpense = analytics?.totalExpense || 0;
  const categoryEntries = Object.entries(analytics?.categoryExpenses || {});
  const accountEntries = Object.entries(analytics?.accountExpenses || {});

  // --- SVG Donut / Pie Chart Generator ---
  const renderDonutChart = () => {
    if (totalExpense <= 0 || categoryEntries.length === 0) return null;

    const radius = 60;
    const strokeWidth = 22;
    const center = radius + strokeWidth;
    const circumference = 2 * Math.PI * radius;

    let accumulatedAngle = 0;

    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartCardTitle}>
          Category Visual Distribution 🎨
        </Text>
        <View style={styles.chartRow}>
          <View style={styles.donutBox}>
            <Svg width={center * 2} height={center * 2}>
              <G rotation="-90" origin={`${center}, ${center}`}>
                {categoryEntries.map(([category, amount], index) => {
                  const percentage = amount / totalExpense;
                  const strokeDashoffset =
                    circumference - percentage * circumference;
                  const angle = accumulatedAngle;
                  accumulatedAngle += percentage * 360;

                  return (
                    <Circle
                      key={category}
                      cx={center}
                      cy={center}
                      r={radius}
                      stroke={PIE_COLORS[index % PIE_COLORS.length]}
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${circumference} ${circumference}`}
                      strokeDashoffset={strokeDashoffset}
                      rotation={angle}
                      origin={`${center}, ${center}`}
                      fill="transparent"
                    />
                  );
                })}
              </G>
            </Svg>
            <View style={styles.donutCenterLabel}>
              <Text style={styles.donutTotalLabel}>Total</Text>
              <Text style={styles.donutTotalValue}>
                ₹{totalExpense.toFixed(0)}
              </Text>
            </View>
          </View>

          {/* Color Legend */}
          <View style={styles.legendBox}>
            {categoryEntries.slice(0, 5).map(([category, amount], index) => {
              const pct = ((amount / totalExpense) * 100).toFixed(0);
              return (
                <View key={category} style={styles.legendItem}>
                  <View
                    style={[
                      styles.colorDot,
                      {
                        backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                      },
                    ]}
                  />
                  <Text style={styles.legendText} numberOfLines={1}>
                    {category} ({pct}%)
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 50 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <Text style={styles.title}>Financial Analytics 📊</Text>
        <Text style={styles.subtitle}>
          Visual charts, spend behavior, & family tracking.
        </Text>

        {/* 1. Scope Switcher */}
        <View style={styles.scopeSwitcher}>
          <TouchableOpacity
            style={[
              styles.scopeBtn,
              selectedScope === "PERSONAL" && styles.scopeBtnActive,
            ]}
            onPress={() => handleScopeChange("PERSONAL")}
          >
            <Text
              style={[
                styles.scopeBtnText,
                selectedScope === "PERSONAL" && styles.scopeBtnTextActive,
              ]}
            >
              👤 Personal
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.scopeBtn,
              selectedScope === "HOUSEHOLD" && styles.scopeBtnActive,
            ]}
            onPress={() => handleScopeChange("HOUSEHOLD")}
          >
            <Text
              style={[
                styles.scopeBtnText,
                selectedScope === "HOUSEHOLD" && styles.scopeBtnTextActive,
              ]}
            >
              👨‍👩‍👧 Family Household
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. Dynamic Period Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodRow}
        >
          {(
            ["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "ALL", "CUSTOM"] as const
          ).map((p) => {
            const isActive = selectedPeriod === p;
            return (
              <TouchableOpacity
                key={p}
                style={[styles.periodPill, isActive && styles.periodPillActive]}
                onPress={() => handlePeriodChange(p)}
              >
                <Text
                  style={[
                    styles.periodPillText,
                    isActive && styles.periodPillTextActive,
                  ]}
                >
                  {p === "DAILY"
                    ? "Today"
                    : p === "WEEKLY"
                      ? "7 Days"
                      : p === "MONTHLY"
                        ? "This Month"
                        : p === "YEARLY"
                          ? "This Year"
                          : p === "ALL"
                            ? "All Time"
                            : "Custom 📅"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Custom Date Picker Card */}
        {selectedPeriod === "CUSTOM" && (
          <View style={styles.customDateCard}>
            <Text style={styles.customDateTitle}>Select Custom Date Range</Text>
            <View style={styles.dateInputsRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Start Date</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD"
                  value={startDate}
                  onChangeText={setStartDate}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>End Date</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD"
                  value={endDate}
                  onChangeText={setEndDate}
                />
              </View>
            </View>
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={handleApplyCustomDates}
            >
              <Text style={styles.applyBtnText}>Apply Filter</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Smart AI Insight Alerts */}
        {analytics?.smartInsights && analytics.smartInsights.length > 0 && (
          <View style={styles.insightsContainer}>
            {analytics.smartInsights.map((insight, idx) => (
              <View key={idx} style={styles.insightCard}>
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Cash Flow KPI Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: "#e8f5e9" }]}>
            <Text style={styles.summaryLabel}>Total Income</Text>
            <Text style={[styles.summaryValue, { color: "#28a745" }]}>
              +₹{(analytics?.totalIncome || 0).toFixed(2)}
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: "#ffebee" }]}>
            <Text style={styles.summaryLabel}>Total Expense</Text>
            <Text style={[styles.summaryValue, { color: "#dc3545" }]}>
              -₹{totalExpense.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Net Savings & Health Gauges */}
        <View style={styles.healthGaugeCard}>
          <View style={styles.gaugeBox}>
            <Text style={styles.gaugeLabel}>Net Savings</Text>
            <Text
              style={[
                styles.gaugeValue,
                {
                  color:
                    (analytics?.netSavings || 0) >= 0 ? "#007AFF" : "#dc3545",
                },
              ]}
            >
              ₹{(analytics?.netSavings || 0).toFixed(2)}
            </Text>
          </View>
          <View style={styles.gaugeDivider} />
          <View style={styles.gaugeBox}>
            <Text style={styles.gaugeLabel}>Savings Rate</Text>
            <Text
              style={[
                styles.gaugeValue,
                {
                  color:
                    (analytics?.savingsRatePercentage || 0) >= 20
                      ? "#28a745"
                      : "#fd7e14",
                },
              ]}
            >
              {(analytics?.savingsRatePercentage || 0).toFixed(1)}%
            </Text>
          </View>
          <View style={styles.gaugeDivider} />
          <View style={styles.gaugeBox}>
            <Text style={styles.gaugeLabel}>Daily Spend</Text>
            <Text style={styles.gaugeValue}>
              ₹{(analytics?.dailyAverageSpend || 0).toFixed(0)}/day
            </Text>
          </View>
        </View>

        {/* 🎨 VISUAL PIE / DONUT CHART */}
        {renderDonutChart()}

        {/* Member Spending Leaderboard (Household Scope Only) */}
        {selectedScope === "HOUSEHOLD" &&
          analytics?.memberSpends &&
          analytics.memberSpends.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>
                Family Member Spending Profiles 👨‍👩‍👧‍👦
              </Text>
              {analytics.memberSpends.map((member) => {
                const isChild = member.role === "CHILD";
                const memberPct =
                  totalExpense > 0
                    ? (member.totalSpent / totalExpense) * 100
                    : 0;

                return (
                  <View key={member.userId} style={styles.memberCard}>
                    <View
                      style={[
                        styles.memberAvatar,
                        { backgroundColor: isChild ? "#fd7e14" : "#007AFF" },
                      ]}
                    >
                      <Text style={styles.avatarText}>
                        {member.memberName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Text style={styles.memberName}>
                          {member.memberName}
                        </Text>
                        <View
                          style={[
                            styles.roleBadge,
                            isChild
                              ? styles.roleBadgeChild
                              : styles.roleBadgeParent,
                          ]}
                        >
                          <Text style={styles.roleBadgeText}>
                            {isChild ? "Child 👶" : "Parent 👨‍👩‍👧"}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.memberSub}>
                        Top Category: {member.topCategory} (
                        {memberPct.toFixed(0)}% of family spend)
                      </Text>

                      <View style={styles.memberProgressBg}>
                        <View
                          style={[
                            styles.memberProgressFill,
                            {
                              width: `${Math.min(memberPct, 100)}%`,
                              backgroundColor: isChild ? "#fd7e14" : "#007AFF",
                            },
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={styles.memberAmount}>
                      ₹{member.totalSpent.toFixed(2)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

        {/* Category Breakdown Progress List */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Category Breakdown Progress</Text>
          {categoryEntries.length > 0 ? (
            categoryEntries.map(([category, amount], idx) => {
              const percentage =
                totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
              const color = PIE_COLORS[idx % PIE_COLORS.length];

              return (
                <View key={category} style={styles.barCard}>
                  <View style={styles.barHeader}>
                    <Text style={styles.barTitle}>{category}</Text>
                    <Text style={styles.barValue}>
                      ₹{amount.toFixed(2)} ({percentage.toFixed(0)}%)
                    </Text>
                  </View>
                  <View style={styles.progressBarBackground}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: color,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                No expense transactions logged for this timeframe.
              </Text>
            </View>
          )}
        </View>

        {/* Account Source Distribution */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Account Distribution 🏦</Text>
          {accountEntries.length > 0 ? (
            accountEntries.map(([accName, amount]) => (
              <View key={accName} style={styles.accountDistRow}>
                <Text style={styles.accName}>{accName}</Text>
                <Text style={styles.accAmount}>₹{amount.toFixed(2)}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                No account distributions recorded.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", color: "#212529", marginTop: 8 },
  subtitle: { fontSize: 13, color: "#6c757d", marginTop: 2, marginBottom: 14 },
  scopeSwitcher: {
    flexDirection: "row",
    backgroundColor: "#e9ecef",
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  scopeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  scopeBtnActive: { backgroundColor: "#ffffff", elevation: 2 },
  scopeBtnText: { fontSize: 13, fontWeight: "600", color: "#6c757d" },
  scopeBtnTextActive: { color: "#007AFF" },
  periodRow: { gap: 8, paddingBottom: 14 },
  periodPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  periodPillActive: { backgroundColor: "#007AFF", borderColor: "#007AFF" },
  periodPillText: { fontSize: 12, fontWeight: "600", color: "#495057" },
  periodPillTextActive: { color: "#ffffff" },
  customDateCard: {
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#007AFF",
    marginBottom: 14,
  },
  customDateTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 8,
  },
  dateInputsRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  inputLabel: {
    fontSize: 11,
    color: "#6c757d",
    marginBottom: 4,
    fontWeight: "600",
  },
  dateInput: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
  },
  applyBtn: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  applyBtnText: { color: "#ffffff", fontWeight: "bold", fontSize: 13 },
  insightsContainer: { marginBottom: 14, gap: 8 },
  insightCard: {
    backgroundColor: "#e7f0ff",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#b8d5ff",
  },
  insightText: { color: "#0056b3", fontSize: 13, fontWeight: "500" },
  summaryRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6c757d",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  summaryValue: { fontSize: 18, fontWeight: "bold", marginTop: 4 },
  healthGaugeCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
    marginBottom: 18,
  },
  gaugeBox: { flex: 1, alignItems: "center" },
  gaugeLabel: {
    fontSize: 10,
    color: "#6c757d",
    textTransform: "uppercase",
    fontWeight: "600",
  },
  gaugeValue: { fontSize: 16, fontWeight: "bold", marginTop: 4 },
  gaugeDivider: { width: 1, backgroundColor: "#e9ecef" },
  chartCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
    marginBottom: 18,
  },
  chartCardTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 12,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  donutBox: {
    width: 160,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  donutCenterLabel: { position: "absolute", alignItems: "center" },
  donutTotalLabel: {
    fontSize: 10,
    color: "#6c757d",
    textTransform: "uppercase",
  },
  donutTotalValue: { fontSize: 16, fontWeight: "bold", color: "#212529" },
  legendBox: { flex: 1, marginLeft: 16, gap: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: "#495057", fontWeight: "500", flex: 1 },
  sectionContainer: { marginTop: 8, marginBottom: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 10,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  memberAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: { color: "#ffffff", fontWeight: "bold", fontSize: 15 },
  memberName: { fontSize: 14, fontWeight: "bold", color: "#212529" },
  roleBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  roleBadgeChild: { backgroundColor: "#fff2cc" },
  roleBadgeParent: { backgroundColor: "#e2f0d9" },
  roleBadgeText: { fontSize: 10, fontWeight: "bold", color: "#495057" },
  memberSub: { fontSize: 11, color: "#6c757d", marginTop: 2, marginBottom: 6 },
  memberProgressBg: {
    height: 4,
    backgroundColor: "#e9ecef",
    borderRadius: 2,
    overflow: "hidden",
  },
  memberProgressFill: { height: "100%", borderRadius: 2 },
  memberAmount: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#dc3545",
    marginLeft: 8,
  },
  barCard: {
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  barHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  barTitle: { fontSize: 14, fontWeight: "600", color: "#212529" },
  barValue: { fontSize: 12, fontWeight: "bold", color: "#6c757d" },
  progressBarBackground: {
    height: 6,
    backgroundColor: "#e9ecef",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", borderRadius: 3 },
  accountDistRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  accName: { fontSize: 14, fontWeight: "600", color: "#212529" },
  accAmount: { fontSize: 14, fontWeight: "bold", color: "#495057" },
  emptyBox: { alignItems: "center", paddingVertical: 20 },
  emptyText: { color: "#6c757d", fontSize: 13 },
});
