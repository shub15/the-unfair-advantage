import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function VoiceScreen() {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingURI, setRecordingURI] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert("Permission needed", "Please grant microphone permission");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await recording.startAsync();

      recordingRef.current = recording;
      setIsRecording(true);
      setDuration(0);
    } catch (error) {
      Alert.alert("Error", "Failed to start recording");
    }
  };

  const stopRecording = async () => {
    try {
      await recordingRef.current?.stopAndUnloadAsync();
      const uri = recordingRef.current?.getURI();
      setRecordingURI(uri);
      setIsRecording(false);

      // Navigate to analysis with audio data
      router.push({
        pathname: "/analysis/processing",
        params: {
          type: "audio",
          audioUri: uri,
        },
      });
    } catch (error) {
      Alert.alert("Error", "Failed to stop recording");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Record Your Business Idea</Text>
        <Text style={styles.subtitle}>
          Speak naturally in any language. Our AI will understand and evaluate
          your concept.
        </Text>

        <View style={styles.recordingArea}>
          <Pressable
            style={[styles.recordButton, isRecording && styles.recordingActive]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Ionicons
              name={isRecording ? "stop" : "mic"}
              size={48}
              color="white"
            />
          </Pressable>

          <Text style={styles.recordingStatus}>
            {isRecording ? "Recording..." : "Tap to start recording"}
          </Text>

          {isRecording && (
            <Text style={styles.duration}>
              {Math.floor(duration / 60)}:{duration % 60}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
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
    marginBottom: 60,
    paddingHorizontal: 20,
  },
  recordingArea: {
    alignItems: "center",
    gap: 24,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  recordingActive: {
    backgroundColor: "#dc2626",
    transform: [{ scale: 1.1 }],
  },
  recordingStatus: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
  },
  duration: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ef4444",
    fontFamily: "monospace",
  },
  waveform: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 40,
  },
  waveBar: {
    width: 3,
    backgroundColor: "#ef4444",
    borderRadius: 2,
  },
});
