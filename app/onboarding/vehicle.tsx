import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';
import { api } from '../../src/lib/api';

export default function VehicleScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [form, setForm] = useState({ make: '', model: '', colour: '', plate: '', seats: '5' });
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  function setField(k: keyof typeof form) { return (v: string) => setForm(f => ({ ...f, [k]: v })); }

  async function takePicture() {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
    if (photo) { setPhotoUri(photo.uri); setShowCamera(false); }
  }

  async function handleContinue() {
    if (!form.make || !form.model || !form.colour || !form.plate || !photoUri) { Alert.alert('All fields required'); return; }
    setLoading(true);
    try {
      const regForm = new FormData();
      regForm.append('file', { uri: photoUri, type: 'image/jpeg', name: 'reg.jpg' } as any);
      regForm.append('doc_type', 'VEHICLE_REG');
      await api.post('/users/verification/document', regForm, { headers: { 'Content-Type': 'multipart/form-data' } });
      await api.post('/users/vehicle', { make: form.make, model: form.model, colour: form.colour, plate_number: form.plate, seat_capacity: Number(form.seats) });
      router.push('/onboarding/driver-type');
    } catch { Alert.alert('Error saving vehicle details. Please try again.'); }
    finally { setLoading(false); }
  }

  if (showCamera) {
    if (!permission?.granted) { requestPermission(); return null; }
    return (
      <View style={{ flex: 1 }}>
        <CameraView style={{ flex: 1 }} ref={cameraRef} facing="back">
          <View style={s.overlay}>
            <Text style={s.hint}>Photograph your vehicle registration document</Text>
            <View style={s.frame} />
            <TouchableOpacity style={s.captureBtn} onPress={takePicture}><View style={s.captureInner} /></TouchableOpacity>
            <TouchableOpacity onPress={() => setShowCamera(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll}>
      <Text style={s.title}>Your vehicle</Text>

      {[
        { label: 'Make', key: 'make', placeholder: 'e.g. Toyota' },
        { label: 'Model', key: 'model', placeholder: 'e.g. Corolla' },
        { label: 'Colour', key: 'colour', placeholder: 'e.g. Silver' },
        { label: 'Plate number', key: 'plate', placeholder: 'e.g. GR-1234-24' },
        { label: 'Total seats (incl. driver)', key: 'seats', placeholder: '5', keyboard: 'numeric' as const },
      ].map(f => (
        <React.Fragment key={f.key}>
          <Text style={s.label}>{f.label}</Text>
          <TextInput style={s.input} placeholder={f.placeholder} placeholderTextColor={COLORS.textMuted} value={form[f.key as keyof typeof form]} onChangeText={setField(f.key as keyof typeof form)} keyboardType={f.keyboard} autoCapitalize="words" />
        </React.Fragment>
      ))}

      <Text style={s.label}>Registration document photo</Text>
      <TouchableOpacity style={s.photoBox} onPress={() => setShowCamera(true)}>
        {photoUri ? <Image source={{ uri: photoUri }} style={s.photo} resizeMode="cover" /> : <><Text style={s.photoIcon}>📄</Text><Text style={s.photoLabel}>Tap to photograph</Text></>}
      </TouchableOpacity>
      {photoUri && <TouchableOpacity onPress={() => setShowCamera(true)}><Text style={s.retake}>Retake</Text></TouchableOpacity>}

      <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleContinue} disabled={loading}>
        <Text style={s.btnText}>{loading ? 'Saving…' : 'Continue'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.xxl, paddingBottom: SPACING.xxl },
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: '700', color: COLORS.white, marginBottom: SPACING.xl },
  label: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: SPACING.xs, marginTop: SPACING.md },
  input: { backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, color: COLORS.white, fontSize: FONTS.sizes.base },
  photoBox: { height: 150, backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', overflow: 'hidden', marginTop: SPACING.xs },
  photo: { width: '100%', height: '100%' },
  photoIcon: { fontSize: 32, marginBottom: SPACING.xs },
  photoLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  retake: { color: COLORS.gold, fontSize: FONTS.sizes.sm, textAlign: 'center', marginTop: SPACING.xs },
  btn: { backgroundColor: COLORS.gold, borderRadius: RADIUS.xl, paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.xl },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: COLORS.navy, fontSize: FONTS.sizes.base, fontWeight: '700' },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'space-around', padding: SPACING.lg },
  frame: { width: 300, height: 200, borderWidth: 2, borderColor: COLORS.gold, borderRadius: RADIUS.md },
  hint: { color: COLORS.white, fontSize: FONTS.sizes.sm, textAlign: 'center' },
  captureBtn: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  captureInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: COLORS.white },
  cancelText: { color: COLORS.white, fontSize: FONTS.sizes.base, padding: SPACING.md },
});
