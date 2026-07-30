import { useFocusEffect } from "expo-router";
import React, { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  FlatList,
  Platform,
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
import apiClient from "../../src/api/client";
import { AuthContext } from "../../src/context/AuthContext";

interface Member {
  userId: number;
  fullName: string;
  email: string;
  role: "PARENT" | "CHILD";
}

interface HouseholdData {
  id: number;
  name: string;
  inviteCode: string;
  members: Member[];
}

interface Transaction {
  id: number;
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  amount: number;
  category: string;
  description: string;
  transactionDate: string;
  userName?: string;
  userId?: number;
  createdById?: number;
  user?: { id: number; fullName: string };
}

export default function HouseholdScreen() {
  const { userData } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [household, setHousehold] = useState<HouseholdData | null>(null);
  const [householdTransactions, setHouseholdTransactions] = useState<
    Transaction[]
  >([]);
  const [refreshing, setRefreshing] = useState(false);

  // Selected Member Filter for Parents: null = All Feed, number = specific child userId
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);

  // Form states for unjoined view
  const [activeTab, setActiveTab] = useState<"CREATE" | "JOIN">("CREATE");
  const [householdName, setHouseholdName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [joinRole, setJoinRole] = useState<"PARENT" | "CHILD">("CHILD");
  const [submitting, setSubmitting] = useState(false);

  // Fetch household details for the logged in user
  const fetchHouseholdDetails = async () => {
    try {
      const response = await apiClient.get("/households/my-household");
      if (response.data && response.data.id) {
        setHousehold(response.data);
        fetchHouseholdTransactions(response.data.id);
      } else {
        setHousehold(null);
      }
    } catch (error: any) {
      setHousehold(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchHouseholdTransactions = async (householdId: number) => {
    try {
      const res = await apiClient.get(`/transactions/household/${householdId}`);
      setHouseholdTransactions(res.data || []);
    } catch (err) {
      console.error("Failed to fetch household transactions:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHouseholdDetails();
    }, []),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHouseholdDetails();
  };

  // Find current user's membership and check if PARENT
  const currentMember = household?.members?.find(
    (m) =>
      Number(m.userId) === Number(userData?.id) ||
      m.email?.toLowerCase() === userData?.email?.toLowerCase(),
  );

  const isParent = currentMember?.role === "PARENT" || !currentMember;

  // Filter children members only (Excludes Parent tabs from the carousel)
  const childMembers =
    household?.members?.filter((m) => m.role === "CHILD") || [];

  // Find currently selected child object
  const selectedChildObj = household?.members?.find(
    (m) => Number(m.userId) === Number(selectedMemberId),
  );

  // 💡 Bulletproof helper to check if a transaction belongs to a given child member
  const doesTxBelongToMember = (tx: Transaction, member: Member) => {
    if (!member) return false;

    const memberId = Number(member.userId);

    // 1. Direct numeric ID checks
    if (tx.userId != null && Number(tx.userId) === memberId) return true;
    if (tx.createdById != null && Number(tx.createdById) === memberId)
      return true;
    if (tx.user?.id != null && Number(tx.user.id) === memberId) return true;

    // 2. Fallback Name string match
    if (tx.userName && member.fullName) {
      if (
        tx.userName.trim().toLowerCase() ===
        member.fullName.trim().toLowerCase()
      ) {
        return true;
      }
    }

    return false;
  };

  // Filter transactions based on Role Scoping:
  // - CHILD: Sees ONLY their own transactions
  // - PARENT: Sees selected child's transactions or All Feed
  const displayTransactions = isParent
    ? selectedMemberId !== null && selectedChildObj
      ? householdTransactions.filter((tx) =>
          doesTxBelongToMember(tx, selectedChildObj),
        )
      : householdTransactions
    : householdTransactions.filter((tx) =>
        doesTxBelongToMember(tx, {
          userId: userData?.id || 0,
          fullName: userData?.fullName || "",
          email: userData?.email || "",
          role: "CHILD",
        }),
      );

  // Calculate total spent for filtered transactions
  const totalExpenses = displayTransactions
    .filter((tx) => tx.type === "EXPENSE")
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Handlers for Create/Join
  const handleCreateHousehold = async () => {
    if (!householdName.trim()) {
      Alert.alert("Error", "Please enter a household name.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await apiClient.post("/households", {
        name: householdName.trim(),
      });
      Alert.alert("Success 🎉", `Household "${response.data.name}" created!`);
      setHouseholdName("");
      if (response.data && response.data.inviteCode) {
        setHousehold(response.data);
        if (response.data.id) fetchHouseholdTransactions(response.data.id);
      } else {
        await fetchHouseholdDetails();
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to create household.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinHousehold = async () => {
    if (!inviteCode.trim()) {
      Alert.alert("Error", "Please enter an invite code.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await apiClient.post("/households/join", {
        inviteCode: inviteCode.trim().toUpperCase(),
        role: joinRole,
      });
      Alert.alert("Success 🎉", "Joined household successfully!");
      setInviteCode("");
      if (response.data && response.data.inviteCode) {
        setHousehold(response.data);
        if (response.data.id) fetchHouseholdTransactions(response.data.id);
      } else {
        await fetchHouseholdDetails();
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Invalid invite code.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const copyInviteCode = () => {
    if (household?.inviteCode) {
      Clipboard.setString(household.inviteCode);
      Alert.alert(
        "Copied! 📋",
        `Share Invite Code "${household.inviteCode}" with family members.`,
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  // --- UNJOINED STATE ---
  if (!household) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.unjoinedHeader}>
          <Text style={styles.title}>Family Household 👨‍👩‍👧‍👦</Text>
          <Text style={styles.subtitle}>
            Connect with family members to share expenses and build
            transparency.
          </Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === "CREATE" && styles.tabBtnActive,
            ]}
            onPress={() => setActiveTab("CREATE")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "CREATE" && styles.tabTextActive,
              ]}
            >
              Create Group
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "JOIN" && styles.tabBtnActive]}
            onPress={() => setActiveTab("JOIN")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "JOIN" && styles.tabTextActive,
              ]}
            >
              Join Group
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "CREATE" ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create a New Household</Text>
            <Text style={styles.cardDesc}>
              You will automatically become Head of Household (PARENT).
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Sharma Family Ledger"
              value={householdName}
              onChangeText={setHouseholdName}
            />
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleCreateHousehold}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Create Household</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Join Existing Household</Text>
            <Text style={styles.cardDesc}>
              Enter the invite code shared by your family member.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Invite Code"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
            />
            <Text style={styles.label}>Select Your Role:</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleBtn,
                  joinRole === "CHILD" && styles.roleBtnActive,
                ]}
                onPress={() => setJoinRole("CHILD")}
              >
                <Text
                  style={[
                    styles.roleBtnText,
                    joinRole === "CHILD" && styles.roleBtnTextActive,
                  ]}
                >
                  Child 👶
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleBtn,
                  joinRole === "PARENT" && styles.roleBtnActive,
                ]}
                onPress={() => setJoinRole("PARENT")}
              >
                <Text
                  style={[
                    styles.roleBtnText,
                    joinRole === "PARENT" && styles.roleBtnTextActive,
                  ]}
                >
                  Parent 👨‍👩‍👧
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleJoinHousehold}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Join Household</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // --- ACTIVE HOUSEHOLD VIEW ---
  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {/* Household Header Card */}
      <View style={styles.activeHeader}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.householdLabel}>Active Household</Text>
          <Text style={styles.householdTitle} numberOfLines={1}>
            {household.name}
          </Text>
        </View>

        <TouchableOpacity style={styles.inviteBadge} onPress={copyInviteCode}>
          <Text style={styles.inviteBadgeLabel}>Code:</Text>
          <Text style={styles.inviteBadgeCode}>
            {household.inviteCode || "N/A"}
          </Text>
          <Text style={{ fontSize: 12 }}>📋</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayTransactions}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <>
            {/* PARENT VIEW: Shows 'All Feed' and ONLY Child Profiles */}
            {isParent ? (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    Children Profiles ({childMembers.length})
                  </Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.profilesScroll}
                >
                  {/* All Feed Pill */}
                  <TouchableOpacity
                    style={[
                      styles.profilePill,
                      selectedMemberId === null && styles.profilePillActive,
                    ]}
                    onPress={() => setSelectedMemberId(null)}
                  >
                    <Text style={styles.profileEmoji}>👨‍👩‍👧‍👦</Text>
                    <Text
                      style={[
                        styles.profileName,
                        selectedMemberId === null && styles.profileNameActive,
                      ]}
                    >
                      All Feed
                    </Text>
                  </TouchableOpacity>

                  {/* ONLY Child Profiles */}
                  {childMembers.map((member) => {
                    const isSelected =
                      Number(selectedMemberId) === Number(member.userId);
                    return (
                      <TouchableOpacity
                        key={member.userId}
                        style={[
                          styles.profilePill,
                          isSelected && styles.profilePillActive,
                        ]}
                        onPress={() => setSelectedMemberId(member.userId)}
                      >
                        <Text style={styles.profileEmoji}>👶</Text>
                        <Text
                          style={[
                            styles.profileName,
                            isSelected && styles.profileNameActive,
                          ]}
                        >
                          {member.fullName
                            ? member.fullName.split(" ")[0]
                            : "Child"}
                        </Text>
                        <View style={styles.childBadgeDot} />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Selected Child Control Card */}
                {selectedMemberId !== null && selectedChildObj ? (
                  <View style={styles.childControlCard}>
                    <View style={styles.childHeaderRow}>
                      <View>
                        <Text style={styles.childControlName}>
                          {selectedChildObj.fullName}
                        </Text>
                        <Text style={styles.childControlRole}>
                          Child Profile
                        </Text>
                      </View>
                      <View style={styles.totalSpendBox}>
                        <Text style={styles.totalSpendLabel}>Spent</Text>
                        <Text style={styles.totalSpendValue}>
                          ${totalExpenses.toFixed(2)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.controlsRow}>
                      <TouchableOpacity
                        style={styles.controlBtn}
                        onPress={() =>
                          Alert.alert(
                            "Spend Limit",
                            `Set monthly budget limit for ${selectedChildObj.fullName}`,
                          )
                        }
                      >
                        <Text style={styles.controlBtnText}>
                          ⚙️ Set Spend Limit
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.controlBtn}
                        onPress={() =>
                          Alert.alert(
                            "Schedule Allowance",
                            `Automate recurring allowance for ${selectedChildObj.fullName}`,
                          )
                        }
                      >
                        <Text style={styles.controlBtnText}>
                          💵 Schedule Allowance
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}
              </>
            ) : (
              /* CHILD VIEW: Simple banner showing their spending */
              <View style={styles.childSelfBanner}>
                <Text style={styles.childSelfLabel}>
                  Your Household Spending
                </Text>
                <Text style={styles.childSelfValue}>
                  ${totalExpenses.toFixed(2)}
                </Text>
              </View>
            )}

            {/* Transactions Section Title */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {!isParent
                  ? "Your Transactions 📜"
                  : selectedMemberId !== null && selectedChildObj
                    ? `${selectedChildObj.fullName}'s Activity 📜`
                    : "Shared Family Ledger 📜"}
              </Text>
            </View>
          </>
        }
        renderItem={({ item }) => {
          const isIncome = item.type === "INCOME";
          return (
            <View style={styles.txCard}>
              <View style={styles.txIconContainer}>
                <Text style={{ fontSize: 18 }}>
                  {isIncome ? "💰" : item.type === "TRANSFER" ? "🔄" : "💸"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txCategory}>
                  {item.category || "General"}
                </Text>
                <Text style={styles.txDesc}>
                  {isParent && item.userName ? `By ${item.userName} • ` : ""}
                  {item.description || "No description"}
                </Text>
              </View>
              <Text
                style={[
                  styles.txAmount,
                  { color: isIncome ? "#28a745" : "#dc3545" },
                ]}
              >
                {isIncome ? "+" : "-"}${Math.abs(item.amount).toFixed(2)}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              No transactions recorded yet for this selection.
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  unjoinedHeader: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 12 : 8,
    paddingBottom: 16,
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#212529" },
  subtitle: { fontSize: 14, color: "#6c757d", marginTop: 4 },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: "#e9ecef",
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: "#ffffff",
    elevation: 2,
  },
  tabText: { fontSize: 14, fontWeight: "600", color: "#6c757d" },
  tabTextActive: { color: "#007AFF" },
  card: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#212529" },
  cardDesc: { fontSize: 13, color: "#6c757d", marginTop: 4, marginBottom: 16 },
  input: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: "#212529",
    marginBottom: 16,
  },
  label: { fontSize: 14, fontWeight: "600", color: "#495057", marginBottom: 8 },
  roleContainer: { flexDirection: "row", gap: 10, marginBottom: 20 },
  roleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  roleBtnActive: { borderColor: "#007AFF", backgroundColor: "#e7f0ff" },
  roleBtnText: { fontSize: 14, fontWeight: "600", color: "#495057" },
  roleBtnTextActive: { color: "#007AFF" },
  primaryBtn: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
  activeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  householdLabel: { fontSize: 12, color: "#6c757d", fontWeight: "500" },
  householdTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212529",
    marginTop: 2,
  },
  inviteBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e7f0ff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  inviteBadgeLabel: { fontSize: 12, color: "#007AFF", fontWeight: "500" },
  inviteBadgeCode: { fontSize: 14, color: "#007AFF", fontWeight: "bold" },
  sectionHeader: { marginTop: 12, marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#212529" },
  profilesScroll: { gap: 10, paddingBottom: 8 },
  profilePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e9ecef",
    gap: 6,
  },
  profilePillActive: { backgroundColor: "#007AFF", borderColor: "#007AFF" },
  profileEmoji: { fontSize: 16 },
  profileName: { fontSize: 14, fontWeight: "600", color: "#495057" },
  profileNameActive: { color: "#ffffff" },
  childBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fd7e14",
  },
  childControlCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#007AFF",
    elevation: 2,
  },
  childHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  childControlName: { fontSize: 18, fontWeight: "bold", color: "#212529" },
  childControlRole: { fontSize: 12, color: "#6c757d", marginTop: 2 },
  totalSpendBox: { alignItems: "flex-end" },
  totalSpendLabel: {
    fontSize: 11,
    color: "#6c757d",
    textTransform: "uppercase",
  },
  totalSpendValue: { fontSize: 18, fontWeight: "bold", color: "#dc3545" },
  controlsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f3f5",
  },
  controlBtn: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  controlBtnText: { fontSize: 12, fontWeight: "600", color: "#212529" },
  childSelfBanner: {
    backgroundColor: "#e7f0ff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    alignItems: "center",
  },
  childSelfLabel: { fontSize: 12, color: "#007AFF", fontWeight: "600" },
  childSelfValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
    marginTop: 4,
  },
  txCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  txIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f3f5",
    justifyContent: "center", // Fixed typo here
    alignItems: "center",
    marginRight: 12,
  },
  txCategory: { fontSize: 15, fontWeight: "600", color: "#212529" },
  txDesc: { fontSize: 12, color: "#6c757d", marginTop: 1 },
  txAmount: { fontSize: 15, fontWeight: "bold" },
  emptyBox: { alignItems: "center", paddingVertical: 24 },
  emptyText: { color: "#6c757d", fontSize: 14 },
});
