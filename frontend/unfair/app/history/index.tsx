import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface Idea {
  id: string;
  title: string;
  preview: string;
  score: number;
  date: string;
  type: string;
}

export default function HistoryScreen() {
  const [ideas, setIdeas] = useState<Idea[]>([]);

  useEffect(() => {
    // Mock data - in real app, load from storage
    const mockIdeas: Idea[] = [
      {
        id: "1",
        title: "Travel Safety Advisory App",
        preview:
          "An app that provides real-time safety information and local insights for travelers...",
        score: 78,
        date: "2025-09-25",
        type: "Voice Note",
      },
      {
        id: "2",
        title: "Local Food Discovery Platform",
        preview:
          "Connect tourists with authentic local food experiences through community recommendations...",
        score: 65,
        date: "2025-09-20",
        type: "Photo",
      },
      {
        id: "3",
        title: "Student Skill Exchange Network",
        preview:
          "A platform where students can teach and learn skills from each other in exchange for credits...",
        score: 82,
        date: "2025-09-15",
        type: "Document",
      },
    ];
    setIdeas(mockIdeas);
  }, []);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const renderIdeaCard = ({ item }: { item: Idea }) => (
    <Pressable
      style={styles.ideaCard}
      onPress={() =>
        router.push({
          pathname: "/analysis/results",
          params: {
            score: item.score,
            analysisId: item.id,
            fromHistory: true,
          },
        })
      }
    >
      <View style={styles.ideaHeader}>
        <Text style={styles.ideaTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View
          style={[
            styles.ideaScore,
            { backgroundColor: `${getScoreColor(item.score)}15` },
          ]}
        >
          <Text
            style={[styles.ideaScoreText, { color: getScoreColor(item.score) }]}
          >
            {item.score}
          </Text>
        </View>
      </View>

      <Text style={styles.ideaPreview} numberOfLines={3}>
        {item.preview}
      </Text>

      <View style={styles.ideaFooter}>
        <Text style={styles.ideaDate}>{formatDate(item.date)}</Text>
        <Text style={styles.ideaType}>{item.type}</Text>
      </View>
    </Pressable>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="bulb-outline"
        size={64}
        color="#cbd5e1"
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>No Ideas Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start capturing your business ideas and they'll appear here for future
        reference
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {ideas.length > 0 ? (
        <FlatList
          data={ideas}
          renderItem={renderIdeaCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyState />
      )}

      <Pressable style={styles.fab} onPress={() => router.push("/capture")}>
        <Ionicons name="add" size={24} color="white" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },
  list: {
    padding: 16,
  },
  ideaCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ideaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  ideaTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
    marginRight: 12,
  },
  ideaScore: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ideaScoreText: {
    fontSize: 12,
    fontWeight: "600",
  },
  ideaPreview: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
    marginBottom: 12,
  },
  ideaFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ideaDate: {
    fontSize: 12,
    color: "#9ca3af",
  },
  ideaType: {
    fontSize: 12,
    color: "#6b7280",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
