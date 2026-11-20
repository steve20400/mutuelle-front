import { Stack } from 'expo-router';

export default function ParametresLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="config" />
      <Stack.Screen name="exercices" />
      <Stack.Screen name="mon-profil" />
    </Stack>
  );
}
