import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface Step {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

type StepStatus = "completed" | "active" | "pending";

interface ProcessingParams {
  type?: string;
  fileUri?: string;
  fileName?: string;
  audioUri?: string;
  imageUri?: string;
  extractedText?: string;
}

export default function ProcessingScreen() {
  const params = useLocalSearchParams<ProcessingParams>();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);

  const steps: Step[] = [
    { id: "upload", label: "Processing Input", icon: "cloud-upload-outline" },
    { id: "extract", label: "Extracting Content", icon: "scan-outline" },
    { id: "translate", label: "Language Processing", icon: "language-outline" },
    { id: "analyze", label: "AI Analysis", icon: "bulb-outline" },
    {
      id: "complete",
      label: "Generating Report",
      icon: "document-text-outline",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          // Navigate to results after completion
          setTimeout(() => {
            router.replace({
              pathname: "/analysis/results",
              params: {
                ...params,
                score: Math.floor(Math.random() * 40) + 60, // Mock score 60-100
                analysisId: Date.now().toString(),
              },
            });
          }, 1000);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const stepIndex = Math.floor(progress / 20);
    setCurrentStep(Math.min(stepIndex, steps.length - 1));
  }, [progress]);

  const getStepStatus = (index: number): StepStatus => {
    if (index < currentStep) return "completed";
    if (index === currentStep) return "active";
    return "pending";
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator
          size="large"
          color="#2563eb"
          style={styles.animation}
        />

        <Text style={styles.title}>Analyzing Your Business Idea</Text>
        <Text style={styles.subtitle}>
          Our AI is evaluating your concept using advanced business intelligence
          models
        </Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {Math.round(progress)}% Complete
          </Text>
        </View>

        <View style={styles.stepsContainer}>
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            return (
              <View key={step.id} style={styles.step}>
                <View
                  style={[
                    styles.stepIcon,
                    status === "active" && styles.stepActive,
                    status === "completed" && styles.stepCompleted,
                    status === "pending" && styles.stepPending,
                  ]}
                >
                  {status === "completed" ? (
                    <Ionicons name="checkmark" size={12} color="white" />
                  ) : status === "active" ? (
                    <ActivityIndicator size={12} color="white" />
                  ) : (
                    <Ionicons name={step.icon} size={12} color="#9ca3af" />
                  )}
                </View>
                <Text
                  style={[
                    styles.stepText,
                    status === "active" && styles.stepTextActive,
                    status === "completed" && styles.stepTextCompleted,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    alignItems: "center",
    maxWidth: 300,
  },
  animation: {
    width: 60,
    height: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  progressContainer: {
    width: "100%",
    marginBottom: 40,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#e2e8f0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2563eb",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginTop: 8,
  },
  stepsContainer: {
    width: "100%",
    gap: 16,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  stepActive: {
    backgroundColor: "#2563eb",
  },
  stepCompleted: {
    backgroundColor: "#10b981",
  },
  stepPending: {
    backgroundColor: "#e2e8f0",
  },
  stepText: {
    fontSize: 16,
    color: "#374151",
  },
  stepTextActive: {
    fontWeight: "600",
    color: "#2563eb",
  },
  stepTextCompleted: {
    color: "#10b981",
  },
});
