import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';
import { api } from '../../src/lib/api';

export default function GhanaCardScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  async function takePicture() {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
    if (photo) { setPhotoUri(photo.uri); setShowCamera(false); }
  }

  async function handleSubmit() {
    if (!photoUri) { Alert.alert('Photo required', 'Please capture your Ghana Card.'); return; }
    if (!cardNumber.trim()) { Alert.alert('Card number required', 'Enter your Ghana Card number.'); return; }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', { uri: photoUri, type: 'image/jpeg', name: 'ghana-card.jpg' } as any);
      form.append('doc_type', 'GHANA_CARD');
      form.append('extracted_number', cardNumber.trim());
      await api.post('/users/verification/document', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      router.push('/onboarding/selfie');
    } catch {
      Alert.alert('Upload failed', 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (showCamera) {
    if (!permission?.granted) { requestPermission(); return null; }
    return (
      <View style={{ flex: 1 }}>
        <CameraView style={{ flex: 1 }} ref={cameraRef} facing="back">
          <View style={styles.cameraOverlay}>
            <View style={styles.cardFrame} />
            <Text style={styles.cameraHint}>Align your Ghana Card within the frame</Text>
            <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
              <View style={styles.captureInner} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCamera(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Ghana Card</Text>
      <Text style={styles.subtitle}>Take a clear photo of the front of your Ghana Card.</Text>

      <TouchableOpacity style={styles.photoBox} onPress={() => setShowCamera(true)}>
        {photoUri
          ? <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
          : <><Text style={styles.photoIcon}>📷</Text><Text style={styles.photoLabel}>Tap to capture</Text></>}
      </TouchableOpacity>
      {photoUri && (
        <TouchableOpacity onPress={() => setShowCamera(true)}>
          <Text style={styles.retake}>Retake photo</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.label}>Ghana Card number</Text>
      <TextInput style={styles.input} placeholder="GHA-XXXXXXXXX-X" placeholderTextColor={COLORS.textMuted} value={cardNumber} onChangeText={setCardNumber} autoCapitalize="characters" />

      <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Uploading…' : 'Continue'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.xxl },
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: '700', color: COLORS.white, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: SPACING.xl },
  photoBox: { height: 200, backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  photoIcon: { fontSize: 40, marginBottom: SPACING.sm },
  photoLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  retake: { color: COLORS.gold, fontSize: FONTS.sizes.sm, textAlign: 'center', marginTop: SPACING.sm },
  label: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginTop: SPACING.xl, marginBottom: SPACING.xs },
  input: { backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, color: COLORS.white, fontSize: FONTS.sizes.base },
  btn: { backgroundColor: COLORS.gold, borderRadius: RADIUS.xl, paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.xl },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: COLORS.navy, fontSize: FONTS.sizes.base, fontWeight: '700' },
  cameraOverlay: { flex: 1, alignItems: 'center', justifyContent: 'space-around', padding: SPACING.lg },
  cardFrame: { width: 300, height: 190, borderWidth: 2, borderColor: COLORS.gold, borderRadius: RADIUS.md },
  cameraHint: { color: COLORS.white, fontSize: FONTS.sizes.sm, textAlign: 'center' },
  captureBtn: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  captureInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: COLORS.white },
  cancelBtn: { padding: SPACING.md },
  cancelText: { color: COLORS.white, fontSize: FONTS.sizes.base },
});
