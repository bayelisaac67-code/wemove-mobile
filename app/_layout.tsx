import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { colors } from '../src/constants/theme';
import { applyGlobalFont } from '../src/lib/fonts';

// Apply the premium font mapping (Inter + Plus Jakarta Sans) to every <Text>
// app-wide. Runs once at module load, before any screen renders.
applyGlobalFont();

// Root layout — required by Expo Router to mount the navigator and render
// any screen. Hosts the app-wide Stack with the premium navy background.
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  // Hold on the navy splash colour until the fonts are ready so the first
  // paint is already in the premium type, never the system font.
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.navy }} />;
  }

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
