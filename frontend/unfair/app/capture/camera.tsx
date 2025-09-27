import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Image, Alert } from "react-native";
import { Camera, CameraType } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import TextRecognition from "@react-native-ml-kit/text-recognition";
import { router } from "expo-router";

export default function CameraScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [camera, setCamera] = useState<Camera | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const takePicture = async () => {
    if (camera) {
      const photo = await camera.takePictureAsync();
      setCapturedImage(photo.uri);
      processImage(photo.uri);
    }
  };

  const processImage = async (imageUri: string) => {
    setProcessing(true);
    try {
      const result = await TextRecognition.recognize(imageUri);
      setExtractedText(result.text);

      // Navigate to analysis with extracted data
      router.push({
        pathname: "/analysis/processing",
        params: {
          type: "image",
          imageUri,
          extractedText: result.text,
        },
      });
    } catch (error) {
      Alert.alert("Error", "Failed to process image");
    } finally {
      setProcessing(false);
    }
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      {!capturedImage ? (
        <Camera style={styles.camera} type={CameraType.back} ref={setCamera}>
          <View style={styles.cameraControls}>
            <Pressable style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </Pressable>
          </View>
        </Camera>
      ) : (
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          {processing && (
            <Text style={styles.processingText}>Processing image...</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "white",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
  },
  previewContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: "90%",
    height: "80%",
    resizeMode: "contain",
  },
  processingText: {
    color: "white",
    fontSize: 18,
    marginTop: 20,
    textAlign: "center",
  },
  retakeButton: {
    position: "absolute",
    bottom: 60,
    left: 30,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retakeButtonText: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "600",
  },
});
