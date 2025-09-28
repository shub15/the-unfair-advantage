import { Stack } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function CaptureLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#2563eb' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerLeft: () => (
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
        ),
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ title: 'Capture Idea' }} 
      />
      <Stack.Screen 
        name="camera" 
        options={{ title: 'Take Photo', headerShown: true }} 
      />
      <Stack.Screen 
        name="voice" 
        options={{ title: 'Record Voice', headerShown: true }} 
      />
      <Stack.Screen 
        name="upload" 
        options={{ title: 'Upload File', headerShown: true }} 
      />
    </Stack>
  );
}
