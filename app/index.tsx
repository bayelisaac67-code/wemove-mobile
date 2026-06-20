import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { colors, typography, spacing, radius } from '../src/constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const { loadFromStorage, token, user } = useAuthStore();

  useEffect(() => {
    loadFromStorage().then(() => {
      if (token && user) {
        router.replace(user.role_flags.includes('DRIVER') ? '/(driver)/home' : '/(passenger)/home');
      }
    });
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.heroSection}>
        <Text style={styles.logo}>WeMove.</Text>
        <Text style={styles.tagline}>Premium, reliable shared{'\n'}rides for the daily commute.</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/onboarding/phone')} activeOpacity={0.85}>
          <Text style={styles.ctaText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/onboarding/phone')} activeOpacity={0.7}>
          <Text style={styles.loginText}>I already have an account</Text>
        </TouchableOpacity>

        <Text style={styles.legal}>By continuing, you agree to our Terms and Privacy Policy.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navy,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 80,
    paddingBottom: 48,
  },
  heroSection: {
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    ...typography.display,
    fontSize: 48,
    color: colors.white,
    marginBottom: spacing.md,
  },
  tagline: {
    fontSize: 20,
    lineHeight: 30,
    color: colors.gold,
    fontWeight: '500',
  },
  footer: {
    gap: spacing.md,
  },
  ctaButton: {
    backgroundColor: colors.gold,
    borderRadius: radius.full,
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaText: {
    ...typography.subtitle,
    color: colors.navy,
    fontWeight: '700',
  },
  loginButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  loginText: {
    ...typography.body,
    color: colors.textSecond,
  },
  legal: {
    ...typography.caption,
    color: colors.textHint,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
