// WeMove design system — premium dark navy + gold
export const colors = {
  // Backgrounds
  navy:        '#0D1B2A',  // primary background (deep navy)
  navyLight:   '#162233',  // card/surface
  navyMid:     '#1E2F42',  // elevated card

  // Brand
  gold:        '#F5B800',  // primary CTA, accents
  goldDark:    '#D4A000',  // pressed state

  // Text
  white:       '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecond:  '#A8B5C2',  // muted
  textHint:    '#5A6B7A',

  // Status
  success:     '#27AE60',
  warning:     '#F39C12',
  danger:      '#E74C3C',
  info:        '#3498DB',

  // Semantic
  border:      '#243447',
  overlay:     'rgba(13,27,42,0.85)',
};

export const typography = {
  // Display
  display:   { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5 },
  headline:  { fontSize: 24, fontWeight: '700' as const },
  title:     { fontSize: 20, fontWeight: '700' as const },
  subtitle:  { fontSize: 17, fontWeight: '600' as const },
  // Body
  body:      { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodyBold:  { fontSize: 15, fontWeight: '600' as const },
  // Small
  caption:   { fontSize: 12, fontWeight: '400' as const },
  label:     { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.5 },
};

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 24, full: 999,
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
};

// ---------------------------------------------------------------------------
// Backwards-compatible UPPERCASE token API.
// ~28 screens were built against an earlier naming (COLORS/FONTS/SPACING/
// RADIUS/SHADOW) before the tokens were lowercased. These aliases keep those
// screens working. Keep both APIs in sync when editing tokens.
// ---------------------------------------------------------------------------
export const COLORS = {
  ...colors,
  error: colors.danger,        // screens use COLORS.error
  textMuted: colors.textSecond, // screens use COLORS.textMuted
};

export const SPACING = spacing;
export const RADIUS = radius;
export const SHADOW = shadow.card; // screens spread `...SHADOW` directly

export const FONTS = {
  sizes: { xs: 12, sm: 14, base: 16, lg: 20, xl: 28 },
};
