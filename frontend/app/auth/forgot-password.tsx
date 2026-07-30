import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import apiClient from "../../src/api/client";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Validate format before making API call
  const isValidEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  const handleSendOtp = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }

    if (!isValidEmail(email.trim())) {
      Alert.alert("Invalid Format", "Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/auth/forgot-password", { email: email.trim() });
      Alert.alert(
        "OTP Sent 📬",
        "Check your email inbox for the 6-digit code.",
      );
      setStep(2);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Failed to send OTP. Please check the email entered.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp.trim() || !newPassword.trim()) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/auth/reset-password", {
        email: email.trim(),
        otp: otp.trim(),
        newPassword: newPassword.trim(),
      });
      Alert.alert("Success 🎉", "Your password has been reset successfully!", [
        { text: "Log In Now", onPress: () => router.replace("/auth/login") },
      ]);
    } catch (error: any) {
      Alert.alert(
        "Reset Failed",
        error?.response?.data?.message || "Failed to reset password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {step === 1 ? "Forgot Password 🔐" : "Reset Password 🔑"}
        </Text>

        {step === 1 ? (
          <>
            <Text style={styles.subtitle}>
              Enter your registered email address to receive a 6-digit OTP code.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter registered email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleSendOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Send OTP Code</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>
              Enter the OTP sent to {email} and choose your new password.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter new password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (step === 2 ? setStep(1) : router.back())}
        >
          <Text style={styles.backBtnText}>
            {step === 2 ? "← Back to Email Step" : "← Back to Login"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  content: { padding: 24, flex: 1, justifyContent: "center" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#212529",
  },
  subtitle: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 24,
    lineHeight: 20,
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#ffffff", fontWeight: "bold", fontSize: 16 },
  backBtn: { marginTop: 16, alignItems: "center", padding: 10 },
  backBtnText: { color: "#6c757d", fontSize: 14, fontWeight: "600" },
});
