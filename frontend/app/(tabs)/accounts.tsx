import { useFocusEffect } from "expo-router";
import React, { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import apiClient from "../../src/api/client";
import { AuthContext } from "../../src/context/AuthContext";

interface Account {
  id: number;
  name: string;
  type: string; // 'BANK' | 'CASH' | 'SAVINGS' | 'CREDIT'
  currency: string;
  currentBalance: number;
}

export default function AccountsScreen() {
  const { userData } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State for Adding New Account
  const [modalVisible, setModalVisible] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState<
    "BANK" | "CASH" | "SAVINGS" | "CREDIT"
  >("BANK");
  const [initialBalance, setInitialBalance] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAccounts = async () => {
    try {
      const response = await apiClient.get("/accounts");
      setAccounts(response.data || []);
    } catch (error: any) {
      console.error(
        "Failed to fetch accounts:",
        error?.response?.data || error.message,
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAccounts();
    }, []),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAccounts();
  };

  const handleCreateAccount = async () => {
    if (!accountName.trim()) {
      Alert.alert("Error", "Please enter an account name.");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post("/accounts", {
        name: accountName.trim(),
        type: accountType,
        currency: "INR",
        initialBalance: parseFloat(initialBalance) || 0,
      });

      Alert.alert("Success 🎉", "New account added!");
      setAccountName("");
      setInitialBalance("");
      setModalVisible(false);
      fetchAccounts();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to create account.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const totalNetWorth = accounts.reduce(
    (acc, curr) => acc + (curr.currentBalance || 0),
    0,
  );

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "BANK":
        return "🏦";
      case "CASH":
        return "💵";
      case "SAVINGS":
        return "🐖";
      case "CREDIT":
        return "💳";
      default:
        return "💰";
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {/* Header & Net Worth Overview Card */}
      <View style={styles.header}>
        <Text style={styles.title}>Accounts & Wallets</Text>
        <Text style={styles.subtitle}>
          Manage your bank accounts, cash, and balances.
        </Text>

        <View style={styles.netWorthCard}>
          <Text style={styles.netWorthLabel}>Total Net Worth</Text>
          <Text style={styles.netWorthValue}>₹{totalNetWorth.toFixed(2)}</Text>
        </View>
      </View>

      {/* Account List */}
      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        renderItem={({ item }) => (
          <View style={styles.accountCard}>
            <View style={styles.accountIconBox}>
              <Text style={{ fontSize: 22 }}>{getAccountIcon(item.type)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.accountName}>{item.name}</Text>
              <Text style={styles.accountType}>
                {item.type} Account • {item.currency || "INR"}
              </Text>
            </View>
            <Text
              style={[
                styles.accountBalance,
                { color: item.currentBalance >= 0 ? "#28a745" : "#dc3545" },
              ]}
            >
              ₹{Number(item.currentBalance).toFixed(2)}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No accounts added yet.</Text>
          </View>
        }
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
      />

      {/* Floating Add Account Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabText}>+ Add Account</Text>
      </TouchableOpacity>

      {/* Add Account Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add New Account 🏦</Text>

            <Text style={styles.label}>Account Name:</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. HDFC Salary Account"
              value={accountName}
              onChangeText={setAccountName}
            />

            <Text style={styles.label}>Account Type:</Text>
            <View style={styles.typeRow}>
              {(["BANK", "CASH", "SAVINGS", "CREDIT"] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeBtn,
                    accountType === t && styles.typeBtnActive,
                  ]}
                  onPress={() => setAccountType(t)}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      accountType === t && styles.typeBtnTextActive,
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Initial Balance (₹):</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 10000"
              keyboardType="numeric"
              value={initialBalance}
              onChangeText={setInitialBalance}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleCreateAccount}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Save Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 12 : 8,
    paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#212529" },
  subtitle: { fontSize: 13, color: "#6c757d", marginTop: 2, marginBottom: 14 },
  netWorthCard: { backgroundColor: "#007AFF", padding: 18, borderRadius: 16 },
  netWorthLabel: {
    color: "#d0e2ff",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  netWorthValue: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 4,
  },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  accountIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f1f3f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  accountName: { fontSize: 16, fontWeight: "bold", color: "#212529" },
  accountType: { fontSize: 12, color: "#6c757d", marginTop: 2 },
  accountBalance: { fontSize: 16, fontWeight: "bold" },
  emptyBox: { alignItems: "center", paddingVertical: 40 },
  emptyText: { color: "#6c757d", fontSize: 14 },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 4,
  },
  fabText: { color: "#ffffff", fontWeight: "bold", fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: { backgroundColor: "#ffffff", borderRadius: 20, padding: 20 },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 16,
  },
  label: { fontSize: 13, fontWeight: "600", color: "#495057", marginBottom: 6 },
  input: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 14,
  },
  typeRow: { flexDirection: "row", gap: 6, marginBottom: 14 },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  typeBtnActive: { backgroundColor: "#007AFF", borderColor: "#007AFF" },
  typeBtnText: { fontSize: 11, fontWeight: "bold", color: "#495057" },
  typeBtnTextActive: { color: "#ffffff" },
  modalBtnRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#e9ecef",
  },
  cancelBtnText: { color: "#495057", fontWeight: "bold" },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#007AFF",
  },
  submitBtnText: { color: "#ffffff", fontWeight: "bold" },
});
