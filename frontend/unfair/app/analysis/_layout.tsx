import { Stack } from 'expo-router';

export default function AnalysisLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#2563eb' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerBackVisible: false,
      }}
    >
      <Stack.Screen 
        name="processing" 
        options={{ title: 'Processing...' }} 
      />
      <Stack.Screen 
        name="results" 
        options={{ title: 'Analysis Results' }} 
      />
    </Stack>
  );
}
