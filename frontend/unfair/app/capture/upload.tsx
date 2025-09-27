import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, Image } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

interface SelectedFile {
  uri: string;
  name: string;
  size: number;
  type: "image" | "document";
}

export default function UploadScreen() {
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        setSelectedFile({
          uri: file.uri,
          name: file.fileName || "image.jpg",
          size: file.fileSize || 0,
          type: "image",
        });
        processFile(file.uri, "image");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image from gallery");
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf", "text/plain"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        setSelectedFile({
          uri: file.uri,
          name: file.name,
          size: file.size || 0,
          type: "document",
        });
        processFile(file.uri, "document");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const processFile = async (
    fileUri: string,
    fileType: "image" | "document"
  ) => {
    setIsUploading(true);
    try {
      // Navigate to processing with file data
      router.push({
        pathname: "/analysis/processing",
        params: {
          type: fileType,
          fileUri: fileUri,
          fileName: selectedFile?.name,
        },
      });
    } catch (error) {
      Alert.alert("Error", "Failed to process file");
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Your Idea</Text>

      <View style={styles.uploadArea}>
        <View style={[styles.dropZone, selectedFile && styles.dropZoneActive]}>
          <Ionicons
            name="cloud-upload-outline"
            size={48}
            color={selectedFile ? "#2563eb" : "#cbd5e1"}
          />
          <Text style={styles.dropZoneText}>
            {selectedFile
              ? "File selected!"
              : "Select images, documents or PDFs"}
          </Text>
        </View>

        {selectedFile && (
          <View style={styles.selectedFile}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              {selectedFile.type === "image" ? (
                <Image
                  source={{ uri: selectedFile.uri }}
                  style={{ width: 50, height: 50, borderRadius: 8 }}
                />
              ) : (
                <Ionicons name="document-outline" size={50} color="#64748b" />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.fileName}>{selectedFile.name}</Text>
                <Text style={styles.fileSize}>
                  {formatFileSize(selectedFile.size)}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.uploadButtons}>
          <Pressable style={styles.uploadButton} onPress={pickFromGallery}>
            <Ionicons name="images-outline" size={20} color="white" />
            <Text style={styles.uploadButtonText}>Gallery</Text>
          </Pressable>

          <Pressable
            style={[styles.uploadButton, styles.uploadButtonSecondary]}
            onPress={pickDocument}
          >
            <Ionicons name="document-outline" size={20} color="#2563eb" />
            <Text
              style={[
                styles.uploadButtonText,
                styles.uploadButtonTextSecondary,
              ]}
            >
              Documents
            </Text>
          </Pressable>
        </View>
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
    marginTop: 40,
    marginBottom: 30,
  },
  uploadArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dropZone: {
    width: "100%",
    height: 200,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    marginBottom: 30,
  },
  dropZoneActive: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  dropZoneText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginTop: 16,
  },
  uploadButtons: {
    width: "100%",
    gap: 16,
  },
  uploadButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  uploadButtonSecondary: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#2563eb",
  },
  uploadButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  uploadButtonTextSecondary: {
    color: "#2563eb",
  },
  selectedFile: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    width: "100%",
  },
  fileName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  fileSize: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
});
