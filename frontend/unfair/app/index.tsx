import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function HomeScreen() {
  return (
    <LinearGradient colors={["#2563eb", "#3b82f6"]} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Transform Your Ideas</Text>
        <Text style={styles.subtitle}>
          Capture your business concepts in any format and get instant
          AI-powered feedback
        </Text>

        <View style={styles.buttonContainer}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push("/capture")}
          >
            <Text style={styles.primaryButtonText}>Start Capturing</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.push("/history")}
          >
            <Text style={styles.secondaryButtonText}>View History</Text>
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginBottom: 40,
  },
  buttonContainer: { width: "100%", gap: 16 },
  primaryButton: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: { fontSize: 18, fontWeight: "600", color: "#2563eb" },
  secondaryButton: {
    borderWidth: 2,
    borderColor: "white",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: { fontSize: 16, fontWeight: "600", color: "white" },
});
