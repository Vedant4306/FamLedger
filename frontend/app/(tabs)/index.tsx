import React, { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// Use SafeAreaView from react-native-safe-area-context for auto-insets
import { File, Paths } from "expo-file-system";
import { useFocusEffect, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { SafeAreaView } from "react-native-safe-area-context";

import apiClient from "../../src/api/client";
import { AuthContext } from "../../src/context/AuthContext";

interface Transaction {
  id: number;
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  amount: number;
  category: string;
  description: string;
  transactionDate: string;
}

type TimeFilter = "ALL" | "TODAY" | "WEEK" | "MONTH" | "YEAR";

export default function DashboardScreen() {
  const { userData, logout } = useContext(AuthContext);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<TimeFilter>("ALL");
  const router = useRouter();

  const fetchTransactions = async () => {
    try {
      const response = await apiClient.get("/transactions");
      setTransactions(response.data);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, []),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  // 📥 DOWNLOAD EXCEL STATEMENT HANDLER (SDK 54+ Modern File & Paths API)
  const handleDownloadStatement = async () => {
    setDownloading(true);
    try {
      // 1. Create a reference to the statement file inside Expo's cache directory
      const statementFile = new File(Paths.cache, "FamLedger_Statement.xlsx");

      // 2. Fetch the binary Excel statement from Spring Boot API
      const response = await apiClient.get("/transactions/export/excel", {
        responseType: "arraybuffer",
      });

      // 3. Convert ArrayBuffer to Uint8Array for binary writing
      const binaryData = new Uint8Array(response.data);

      // 4. Create file if it doesn't exist & write binary buffer directly
      if (!statementFile.exists) {
        statementFile.create();
      }
      statementFile.write(binaryData);

      // 5. Open native mobile share/save dialog using the file URI
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(statementFile.uri, {
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "FamLedger Transaction Statement",
          UTI: "com.microsoft.excel.xlsx",
        });
      } else {
        Alert.alert("Success", `Statement saved to: ${statementFile.uri}`);
      }
    } catch (error: any) {
      console.error("Export error:", error?.response?.data || error.message);
      Alert.alert(
        "Download Error",
        "Failed to generate statement. Please ensure your Spring Boot backend server is running.",
      );
    } finally {
      setDownloading(false);
    }
  };

  // Delete transaction handler
  const handleDeleteTransaction = (id: number) => {
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiClient.delete(`/transactions/${id}`);
              fetchTransactions();
            } catch (error) {
              console.error("Failed to delete transaction:", error);
              Alert.alert("Error", "Failed to delete the transaction.");
            }
          },
        },
      ],
    );
  };

  // Action Menu on item click
  const handleTransactionPress = (item: Transaction) => {
    Alert.alert(
      "Manage Transaction",
      `${item.category || "Transaction"} - $${Math.abs(item.amount).toFixed(2)}`,
      [
        {
          text: "Edit",
          onPress: () => {
            router.push({
              pathname: "/modal",
              params: {
                id: item.id.toString(),
                amount: item.amount.toString(),
                type: item.type,
                category: item.category,
                description: item.description,
                transactionDate: item.transactionDate,
              },
            });
          },
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDeleteTransaction(item.id),
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  // Date Filtering Logic
  const filteredTransactions = transactions.filter((tx) => {
    if (activeFilter === "ALL") return true;

    const txDate = new Date(tx.transactionDate);
    const now = new Date();

    if (activeFilter === "TODAY") {
      return txDate.toDateString() === now.toDateString();
    }

    if (activeFilter === "WEEK") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      return txDate >= sevenDaysAgo && txDate <= now;
    }

    if (activeFilter === "MONTH") {
      return (
        txDate.getMonth() === now.getMonth() &&
        txDate.getFullYear() === now.getFullYear()
      );
    }

    if (activeFilter === "YEAR") {
      return txDate.getFullYear() === now.getFullYear();
    }

    return true;
  });

  // Calculate Net Balance for filtered transactions
  const totalBalance = filteredTransactions.reduce((acc, curr) => {
    if (curr.type === "INCOME") return acc + curr.amount;
    if (curr.type === "EXPENSE") return acc - curr.amount;
    return acc;
  }, 0);

  // Helper function to format ISO date to "Jul 28, 2026 • 10:30 AM"
  const formatDateTime = (dateString: string) => {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const formattedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return `${formattedDate} • ${formattedTime}`;
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isIncome = item.type === "INCOME";
    return (
      <TouchableOpacity
        style={styles.transactionCard}
        onPress={() => handleTransactionPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.txIconContainer}>
          <Text style={styles.txIcon}>
            {isIncome ? "💰" : item.type === "TRANSFER" ? "🔄" : "💸"}
          </Text>
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txCategory}>{item.category || "General"}</Text>
          <Text style={styles.txDescription} numberOfLines={1}>
            {item.description || "No description"}
          </Text>
          <Text style={styles.txDateTime}>
            ⏰ {formatDateTime(item.transactionDate)}
          </Text>
        </View>
        <Text
          style={[styles.txAmount, { color: isIncome ? "#28a745" : "#dc3545" }]}
        >
          {isIncome ? "+" : "-"}${Math.abs(item.amount).toFixed(2)}
        </Text>
      </TouchableOpacity>
    );
  };

  const filterOptions: { key: TimeFilter; label: string }[] = [
    { key: "ALL", label: "All Time" },
    { key: "TODAY", label: "Today" },
    { key: "WEEK", label: "This Week" },
    { key: "MONTH", label: "This Month" },
    { key: "YEAR", label: "This Year" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* 1. Dark status bar text/icons */}
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {/* 2. Top Header with extra vertical spacing */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{userData?.fullName || "User"} 👋</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Main Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>
          {activeFilter === "ALL"
            ? "Main Account Balance"
            : `${filterOptions.find((f) => f.key === activeFilter)?.label} Summary`}
        </Text>
        <Text style={styles.balanceAmount}>${totalBalance.toFixed(2)}</Text>
      </View>

      {/* 📊 Download Statement Button */}
      <TouchableOpacity
        style={styles.exportBtn}
        onPress={handleDownloadStatement}
        disabled={downloading}
      >
        {downloading ? (
          <ActivityIndicator color="#007AFF" size="small" />
        ) : (
          <Text style={styles.exportBtnText}>📊 Export Statement (.xlsx)</Text>
        )}
      </TouchableOpacity>

      {/* Period Filter Scrollable Chips */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filterOptions.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.filterChip,
                activeFilter === item.key && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(item.key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === item.key && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Transactions Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <Text style={styles.sectionCount}>({filteredTransactions.length})</Text>
      </View>

      {loading ? (
        <ActivityIndicator
          style={{ marginTop: 32 }}
          size="large"
          color="#007AFF"
        />
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTransactionItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No transactions for this selected time period.
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Add Transaction Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/modal")}
      >
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 12 : 8,
    paddingBottom: 12,
  },
  greeting: { fontSize: 14, color: "#6c757d" },
  userName: { fontSize: 20, fontWeight: "bold", color: "#212529" },
  logoutBtn: {
    backgroundColor: "#ffebe9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  logoutText: { color: "#dc3545", fontWeight: "600", fontSize: 12 },
  balanceCard: {
    backgroundColor: "#007AFF",
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontWeight: "500",
  },
  balanceAmount: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "bold",
    marginTop: 6,
  },
  exportBtn: {
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  exportBtnText: {
    color: "#007AFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  filterSection: { marginVertical: 6 },
  filterScroll: { paddingHorizontal: 20, gap: 8 },
  filterChip: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  filterChipActive: { backgroundColor: "#007AFF", borderColor: "#007AFF" },
  filterChipText: { fontSize: 13, color: "#495057", fontWeight: "500" },
  filterChipTextActive: { color: "#ffffff", fontWeight: "bold" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
    gap: 6,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#212529" },
  sectionCount: { fontSize: 14, color: "#6c757d", fontWeight: "600" },
  listContainer: { paddingHorizontal: 20, paddingBottom: 90 },
  transactionCard: {
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  txIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#f1f3f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  txIcon: { fontSize: 18 },
  txInfo: { flex: 1, marginRight: 8 },
  txCategory: { fontSize: 15, fontWeight: "600", color: "#212529" },
  txDescription: { fontSize: 13, color: "#6c757d", marginTop: 1 },
  txDateTime: {
    fontSize: 11,
    color: "#adb5bd",
    marginTop: 3,
    fontWeight: "500",
  },
  txAmount: { fontSize: 16, fontWeight: "bold" },
  emptyContainer: { alignItems: "center", marginTop: 32 },
  emptyText: { color: "#6c757d", fontSize: 14 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    backgroundColor: "#007AFF",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabIcon: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "bold",
    lineHeight: 30,
  },
});
