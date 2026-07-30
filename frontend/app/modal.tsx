import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import apiClient from "../src/api/client";
import { AuthContext } from "../src/context/AuthContext";

const EXPENSE_CATEGORIES = [
  "🍔 Food & Dining",
  "🛒 Groceries",
  "🚗 Transportation",
  "🛍️ Shopping",
  "💡 Bills & Utilities",
  "🎬 Entertainment",
  "💊 Health",
  "✨ Other",
];

const INCOME_CATEGORIES = [
  "💼 Salary",
  "🎁 Allowance",
  "🤝 Bonus / Gift",
  "📈 Investment",
  "💵 Other Income",
];

export default function AddTransactionModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    amount?: string;
    type?: "EXPENSE" | "INCOME" | "TRANSFER";
    category?: string;
    description?: string;
    transactionDate?: string;
  }>();

  const isEditing = Boolean(params.id);

  const { userData } = useContext(AuthContext);

  const [type, setType] = useState<"EXPENSE" | "INCOME" | "TRANSFER">(
    params.type || "EXPENSE",
  );
  const [amount, setAmount] = useState(
    params.amount ? String(Math.abs(Number(params.amount))) : "",
  );
  const [category, setCategory] = useState(
    params.category || EXPENSE_CATEGORIES[0],
  );
  const [description, setDescription] = useState(params.description || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.type) {
      setType(params.type);
    }
    if (params.amount) {
      setAmount(String(Math.abs(Number(params.amount))));
    }
    if (params.category) {
      setCategory(params.category);
    }
    if (params.description) {
      setDescription(params.description);
    }
  }, [params.id]);

  const handleTypeChange = (newType: "EXPENSE" | "INCOME" | "TRANSFER") => {
    setType(newType);
    if (newType === "EXPENSE") setCategory(EXPENSE_CATEGORIES[0]);
    if (newType === "INCOME") setCategory(INCOME_CATEGORIES[0]);
    if (newType === "TRANSFER") setCategory("🔄 Account Transfer");
  };

  const handleSubmit = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid numeric amount.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        type,
        amount: parseFloat(amount),
        category,
        description,
        transactionDate: params.transactionDate || new Date().toISOString(),
      };

      if (isEditing) {
        // Update existing transaction via PUT
        await apiClient.put(`/transactions/${params.id}`, payload);
        Alert.alert("Success", "Transaction updated successfully!");
      } else {
        // Post new transaction via POST
        await apiClient.post("/transactions", payload);
        Alert.alert("Success", "Transaction logged successfully!");
      }

      router.back(); // Close modal sheet and return to Dashboard
    } catch (error: any) {
      console.error(
        "Failed to save transaction:",
        error?.response?.data || error.message,
      );
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to save transaction.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>
          {isEditing ? "Edit Transaction ✏️" : "New Transaction 📝"}
        </Text>

        {/* Type Selector Tabs */}
        <View style={styles.typeContainer}>
          <TouchableOpacity
            style={[
              styles.typeBtn,
              type === "EXPENSE" && styles.typeBtnActiveExpense,
            ]}
            onPress={() => handleTypeChange("EXPENSE")}
          >
            <Text
              style={[
                styles.typeText,
                type === "EXPENSE" && styles.typeTextActive,
              ]}
            >
              Expense
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeBtn,
              type === "INCOME" && styles.typeBtnActiveIncome,
            ]}
            onPress={() => handleTypeChange("INCOME")}
          >
            <Text
              style={[
                styles.typeText,
                type === "INCOME" && styles.typeTextActive,
              ]}
            >
              Income
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeBtn,
              type === "TRANSFER" && styles.typeBtnActiveTransfer,
            ]}
            onPress={() => handleTypeChange("TRANSFER")}
          >
            <Text
              style={[
                styles.typeText,
                type === "TRANSFER" && styles.typeTextActive,
              ]}
            >
              Transfer
            </Text>
          </TouchableOpacity>
        </View>

        {/* Amount Input */}
        <Text style={styles.label}>Amount ($)</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />

        {/* Category Picker */}
        {type !== "TRANSFER" && (
          <>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoriesGrid}>
              {(type === "EXPENSE"
                ? EXPENSE_CATEGORIES
                : INCOME_CATEGORIES
              ).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, category === cat && styles.chipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      category === cat && styles.chipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Description Input */}
        <Text style={styles.label}>Description / Note</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Lunch with team or Pocket Money"
          value={description}
          onChangeText={setDescription}
        />

        {/* Submit & Cancel Buttons */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            type === "INCOME"
              ? { backgroundColor: "#28a745" }
              : type === "TRANSFER"
                ? { backgroundColor: "#17a2b8" }
                : { backgroundColor: "#007AFF" },
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>
              {isEditing ? "Update Transaction" : "Save Transaction"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  scrollContent: { padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 20,
    textAlign: "center",
  },
  typeContainer: {
    flexDirection: "row",
    backgroundColor: "#e9ecef",
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  typeBtnActiveExpense: { backgroundColor: "#dc3545" },
  typeBtnActiveIncome: { backgroundColor: "#28a745" },
  typeBtnActiveTransfer: { backgroundColor: "#17a2b8" },
  typeText: { fontSize: 14, fontWeight: "600", color: "#6c757d" },
  typeTextActive: { color: "#ffffff" },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8,
    marginTop: 12,
  },
  amountInput: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 10,
    padding: 16,
    fontSize: 28,
    fontWeight: "bold",
    color: "#212529",
    textAlign: "center",
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: "#212529",
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: "#f1f3f5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  chipActive: { backgroundColor: "#007AFF", borderColor: "#007AFF" },
  chipText: { fontSize: 13, color: "#495057", fontWeight: "500" },
  chipTextActive: { color: "#ffffff", fontWeight: "bold" },
  submitBtn: {
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 28,
  },
  submitBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
  cancelBtn: { padding: 14, alignItems: "center", marginTop: 8 },
  cancelBtnText: { color: "#6c757d", fontSize: 15, fontWeight: "600" },
});
