import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface CaptureOption {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

export default function CaptureScreen() {
  const options: CaptureOption[] = [
    {
      id: "camera",
      title: "Take Photo",
      subtitle: "Capture handwritten notes or sketches",
      icon: "camera-outline" as const,
      route: "/capture/camera",
    },
    {
      id: "voice",
      title: "Record Voice",
      subtitle: "Explain your idea verbally",
      icon: "mic-outline" as const,
      route: "/capture/voice",
    },
    {
      id: "upload",
      title: "Upload File",
      subtitle: "Select existing images or documents",
      icon: "cloud-upload-outline" as const,
      route: "/capture/upload",
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        How would you like to capture your idea?
      </Text>

      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <Pressable
            key={option.id}
            style={styles.optionCard}
            onPress={() => router.push(option.route)}
          >
            <Ionicons name={option.icon} size={48} color="#2563eb" />
            <Text style={styles.optionTitle}>{option.title}</Text>
            <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
    marginTop: 40,
    marginBottom: 30,
  },
  optionsContainer: {
    flex: 1,
    gap: 20,
  },
  optionCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 16,
    marginBottom: 8,
  },
  optionSubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },
});
