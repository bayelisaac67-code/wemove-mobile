import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';
import { api } from '../../src/lib/api';

export default function SelfieScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  async function takeSelfie() {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
    if (photo) { setPhotoUri(photo.uri); setShowCamera(false); }
  }

  async function handleSubmit() {
    if (!photoUri) { Alert.alert('Selfie required', 'Please take a selfie.'); return; }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', { uri: photoUri, type: 'image/jpeg', name: 'selfie.jpg' } as any);
      form.append('doc_type', 'SELFIE');
      await api.post('/users/verification/document', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      await api.post('/users/verification/submit');
      router.push('/onboarding/verification-status');
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
        <CameraView style={{ flex: 1 }} ref={cameraRef} facing="front">
          <View style={styles.cameraOverlay}>
            <Text style={styles.hint}>Look straight at the camera</Text>
            <View style={styles.faceOval} />
            <Text style={styles.hint}>Make sure your face is well-lit</Text>
            <TouchableOpacity style={styles.captureBtn} onPress={takeSelfie}>
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
    <View style={styles.container}>
      <Text style={styles.title}>Take a selfie</Text>
      <Text style={styles.subtitle}>We'll match your face to your Ghana Card to verify your identity.</Text>

      <TouchableOpacity style={styles.photoBox} onPress={() => setShowCamera(true)}>
        {photoUri
          ? <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
          : <><Text style={styles.photoIcon}>🤳</Text><Text style={styles.photoLabel}>Tap to take selfie</Text></>}
      </TouchableOpacity>
      {photoUri && (
        <TouchableOpacity onPress={() => setShowCamera(true)}>
          <Text style={styles.retake}>Retake selfie</Text>
        </TouchableOpacity>
      )}

      <View style={styles.tips}>
        {['Face the camera directly', 'Good lighting, no shadows', 'No glasses or hat'].map(t => (
          <Text key={t} style={styles.tip}>✓  {t}</Text>
        ))}
      </View>

      <TouchableOpacity style={[styles.btn, (!photoUri || loading) && styles.btnDisabled]} onPress={handleSubmit} disabled={!photoUri || loading}>
        <Text style={styles.btnText}>{loading ? 'Submitting…' : 'Submit for verification'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy, padding: SPACING.lg, paddingTop: SPACING.xxl },
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: '700', color: COLORS.white, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: SPACING.xl },
  photoBox: { height: 260, backgroundColor: COLORS.navyLight, borderRadius: 130, alignSelf: 'center', width: 260, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.border, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  photoIcon: { fontSize: 48, marginBottom: SPACING.sm },
  photoLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  retake: { color: COLORS.gold, fontSize: FONTS.sizes.sm, textAlign: 'center', marginTop: SPACING.sm },
  tips: { marginTop: SPACING.xl, gap: SPACING.sm },
  tip: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  btn: { backgroundColor: COLORS.gold, borderRadius: RADIUS.xl, paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.xl },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: COLORS.navy, fontSize: FONTS.sizes.base, fontWeight: '700' },
  cameraOverlay: { flex: 1, alignItems: 'center', justifyContent: 'space-evenly' },
  faceOval: { width: 240, height: 300, borderRadius: 120, borderWidth: 3, borderColor: COLORS.gold },
  hint: { color: COLORS.white, fontSize: FONTS.sizes.sm, textAlign: 'center', paddingHorizontal: SPACING.lg },
  captureBtn: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  captureInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: COLORS.white },
  cancelBtn: { padding: SPACING.md },
  cancelText: { color: COLORS.white, fontSize: FONTS.sizes.base },
});
