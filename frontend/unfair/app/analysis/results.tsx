import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface RouteParams {
  score?: string;
  analysisId?: string;
  fromHistory?: string;
}

export default function ResultsScreen() {
  const params = useLocalSearchParams<RouteParams>();
  const score = parseInt(params.score as string) || 75;

  const getScoreColor = (score: number): [string, string] => {
    if (score >= 80) return ["#10b981", "#059669"];
    if (score >= 60) return ["#f59e0b", "#d97706"];
    return ["#ef4444", "#dc2626"];
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return "Excellent Potential";
    if (score >= 60) return "Good Potential";
    return "Needs Improvement";
  };

  const mockAnalysis = {
    summary:
      "Your travel advisory app concept shows strong potential in the growing digital travel market. The idea addresses real pain points for travelers seeking local insights and safety information.",
    strengths: [
      "Addresses genuine market need for travel safety",
      "Leverages user-generated content effectively",
      "Scalable business model with multiple revenue streams",
      "Strong differentiation from existing solutions",
    ],
    weaknesses: [
      "High competition in travel app market",
      "Requires significant user acquisition investment",
      "Content moderation challenges",
      "Dependency on user-generated content quality",
    ],
    recommendations: [
      "Start with a specific niche (e.g., solo female travelers)",
      "Partner with local tourism boards for credibility",
      "Implement robust verification systems",
      "Consider freemium pricing model",
    ],
    marketSize:
      "The global travel app market is valued at $7.8B and growing at 8.5% annually",
    nextSteps:
      "Validate your concept with 50+ potential users through surveys and interviews before building an MVP",
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.scoreContainer}>
            <LinearGradient
              colors={getScoreColor(score)}
              style={styles.scoreCircle}
            >
              <Text style={styles.scoreText}>{score}</Text>
            </LinearGradient>
            <Text style={styles.scoreLabel}>{getScoreLabel(score)}</Text>
            <Text style={styles.scoreSubtitle}>Business Viability Score</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <Text style={styles.sectionContent}>{mockAnalysis.summary}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Market Analysis</Text>
          <Text style={styles.sectionContent}>{mockAnalysis.marketSize}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Strengths & Opportunities</Text>
          <View style={styles.strengthsWeaknesses}>
            <View style={styles.strengthsColumn}>
              <Text style={[styles.columnTitle, styles.strengthsTitle]}>
                Strengths
              </Text>
              {mockAnalysis.strengths.map((item, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    marginBottom: 8,
                  }}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color="#10b981"
                    style={{ marginRight: 8, marginTop: 2 }}
                  />
                  <Text style={styles.listItem}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Areas for Improvement</Text>
          {mockAnalysis.weaknesses.map((item, index) => (
            <View
              key={index}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                marginBottom: 8,
              }}
            >
              <Ionicons
                name="alert-circle"
                size={16}
                color="#f59e0b"
                style={{ marginRight: 8, marginTop: 2 }}
              />
              <Text style={styles.listItem}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {mockAnalysis.recommendations.map((item, index) => (
            <View
              key={index}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                marginBottom: 8,
              }}
            >
              <Ionicons
                name="bulb"
                size={16}
                color="#2563eb"
                style={{ marginRight: 8, marginTop: 2 }}
              />
              <Text style={styles.listItem}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Steps</Text>
          <Text style={styles.sectionContent}>{mockAnalysis.nextSteps}</Text>
        </View>
      </ScrollView>

      <View style={styles.actionButtons}>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push("/capture")}
        >
          <Text style={styles.secondaryButtonText}>New Analysis</Text>
        </Pressable>
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push("/history")}
        >
          <Text style={styles.primaryButtonText}>Save to History</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContent: {
    flex: 1,
    padding: 20,
  },
  header: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreContainer: {
    alignItems: "center",
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  scoreLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  scoreSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  section: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  strengthsWeaknesses: {
    gap: 12,
  },
  strengthsColumn: {
    flex: 1,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  strengthsTitle: {
    color: "#10b981",
  },
  listItem: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "600",
  },
});
