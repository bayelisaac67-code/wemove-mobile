import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';
import { api } from '../../src/lib/api';

export default function DriverLicenceScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [licenceNumber, setLicenceNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  async function takePicture() {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
    if (photo) { setPhotoUri(photo.uri); setShowCamera(false); }
  }

  async function handleContinue() {
    if (!photoUri || !licenceNumber || !expiry) { Alert.alert('All fields required'); return; }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', { uri: photoUri, type: 'image/jpeg', name: 'licence.jpg' } as any);
      form.append('doc_type', 'DRIVER_LICENCE');
      form.append('extracted_number', licenceNumber.trim());
      form.append('expiry', expiry.trim());
      await api.post('/users/verification/document', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      router.push('/onboarding/vehicle');
    } catch { Alert.alert('Upload failed. Please try again.'); }
    finally { setLoading(false); }
  }

  if (showCamera) {
    if (!permission?.granted) { requestPermission(); return null; }
    return (
      <View style={{ flex: 1 }}>
        <CameraView style={{ flex: 1 }} ref={cameraRef} facing="back">
          <View style={s.overlay}>
            <View style={s.frame} />
            <Text style={s.hint}>Align your driver's licence within the frame</Text>
            <TouchableOpacity style={s.captureBtn} onPress={takePicture}><View style={s.captureInner} /></TouchableOpacity>
            <TouchableOpacity onPress={() => setShowCamera(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll}>
      <Text style={s.title}>Driver's licence</Text>
      <TouchableOpacity style={s.photoBox} onPress={() => setShowCamera(true)}>
        {photoUri ? <Image source={{ uri: photoUri }} style={s.photo} resizeMode="cover" /> : <><Text style={s.photoIcon}>📸</Text><Text style={s.photoLabel}>Tap to photograph licence</Text></>}
      </TouchableOpacity>
      {photoUri && <TouchableOpacity onPress={() => setShowCamera(true)}><Text style={s.retake}>Retake</Text></TouchableOpacity>}

      <Text style={s.label}>Licence number</Text>
      <TextInput style={s.input} placeholder="e.g. GH-12345678" placeholderTextColor={COLORS.textMuted} value={licenceNumber} onChangeText={setLicenceNumber} autoCapitalize="characters" />

      <Text style={s.label}>Expiry date</Text>
      <TextInput style={s.input} placeholder="MM/YYYY" placeholderTextColor={COLORS.textMuted} value={expiry} onChangeText={setExpiry} keyboardType="numbers-and-punctuation" />

      <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleContinue} disabled={loading}>
        <Text style={s.btnText}>{loading ? 'Uploading…' : 'Continue'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.xxl },
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: '700', color: COLORS.white, marginBottom: SPACING.xl },
  photoBox: { height: 180, backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', overflow: 'hidden', marginBottom: SPACING.sm },
  photo: { width: '100%', height: '100%' },
  photoIcon: { fontSize: 36, marginBottom: SPACING.sm },
  photoLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  retake: { color: COLORS.gold, fontSize: FONTS.sizes.sm, textAlign: 'center', marginBottom: SPACING.lg },
  label: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: SPACING.xs, marginTop: SPACING.md },
  input: { backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, color: COLORS.white, fontSize: FONTS.sizes.base },
  btn: { backgroundColor: COLORS.gold, borderRadius: RADIUS.xl, paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.xl },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: COLORS.navy, fontSize: FONTS.sizes.base, fontWeight: '700' },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'space-around', padding: SPACING.lg },
  frame: { width: 300, height: 180, borderWidth: 2, borderColor: COLORS.gold, borderRadius: RADIUS.md },
  hint: { color: COLORS.white, fontSize: FONTS.sizes.sm },
  captureBtn: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  captureInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: COLORS.white },
  cancelText: { color: COLORS.white, fontSize: FONTS.sizes.base, padding: SPACING.md },
});
