import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../src/constants/theme';

// Root layout — required by Expo Router to mount the navigator and render
// any screen. Hosts the app-wide Stack with the premium navy background.
export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.navy },
          animation: 'slide_from_right',
        }}
      />
    </>
  );
}
