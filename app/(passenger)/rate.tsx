import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../src/constants/theme';
import { api } from '../../src/lib/api';

const TAGS = ['Punctual', 'Safe driver', 'Clean vehicle', 'Friendly', 'Late', 'Reckless', 'Dirty vehicle'];

export default function RateScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [stars, setStars] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  function toggleTag(t: string) {
    setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  async function handleSubmit() {
    if (!stars) { Alert.alert('Please give a star rating'); return; }
    setLoading(true);
    try {
      await api.post('/ratings', { booking_id: bookingId, stars, reason_tags: selectedTags, comment: comment.trim() || undefined });
      router.replace('/(passenger)/home');
    } catch {
      Alert.alert('Failed to submit rating. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>Rate your trip</Text>
      <Text style={s.subtitle}>How was your ride?</Text>

      <View style={s.starsRow}>
        {[1,2,3,4,5].map(n => (
          <TouchableOpacity key={n} onPress={() => setStars(n)}>
            <Text style={[s.star, stars >= n && s.starActive]}>{stars >= n ? '⭐' : '☆'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.tagsLabel}>What stood out?</Text>
      <View style={s.tagsWrap}>
        {TAGS.map(t => (
          <TouchableOpacity key={t} style={[s.tag, selectedTags.includes(t) && s.tagSelected]} onPress={() => toggleTag(t)}>
            <Text style={[s.tagText, selectedTags.includes(t) && s.tagTextSelected]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput style={s.input} placeholder="Add a comment (optional)" placeholderTextColor={COLORS.textMuted} value={comment} onChangeText={setComment} multiline numberOfLines={3} />

      <TouchableOpacity style={[s.btn, (!stars || loading) && s.btnDisabled]} onPress={handleSubmit} disabled={!stars || loading}>
        <Text style={s.btnText}>{loading ? 'Submitting…' : 'Submit rating'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/(passenger)/home')} style={{ marginTop: SPACING.md, alignItems: 'center' }}>
        <Text style={{ color: COLORS.textMuted, fontSize: FONTS.sizes.sm }}>Skip</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy, padding: SPACING.lg, paddingTop: SPACING.xxl },
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: '700', color: COLORS.white, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: SPACING.xl },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.sm, marginBottom: SPACING.xl },
  star: { fontSize: 40, color: COLORS.textMuted },
  starActive: { color: COLORS.gold },
  tagsLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: SPACING.md },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xl },
  tag: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border },
  tagSelected: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  tagText: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
  tagTextSelected: { color: COLORS.navy, fontWeight: '600' },
  input: { backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.white, fontSize: FONTS.sizes.base, marginBottom: SPACING.xl, textAlignVertical: 'top' },
  btn: { backgroundColor: COLORS.gold, borderRadius: RADIUS.xl, paddingVertical: SPACING.md, alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: COLORS.navy, fontSize: FONTS.sizes.base, fontWeight: '700' },
});
