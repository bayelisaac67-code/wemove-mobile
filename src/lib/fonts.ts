// Premium typography matching the reference app (base44 wemove-motion-sync):
// body copy in Inter, bold/headings in Plus Jakarta Sans.
//
// The passenger screens use raw <Text> with fontWeight but no fontFamily, so
// rather than edit every screen we patch React Native's Text/TextInput once to
// inject the right family based on each element's fontWeight. Explicit families
// (e.g. icon fonts) are always respected. Guarded so it can never crash render.
import { Text as RNText, TextInput as RNTextInput, StyleSheet } from 'react-native';

const WEIGHT_TO_FAMILY: Record<string, string> = {
  '100': 'Inter_400Regular',
  '200': 'Inter_400Regular',
  '300': 'Inter_400Regular',
  '400': 'Inter_400Regular',
  normal: 'Inter_400Regular',
  '500': 'Inter_500Medium',
  '600': 'Inter_600SemiBold',
  '700': 'PlusJakartaSans_700Bold',
  bold: 'PlusJakartaSans_700Bold',
  '800': 'PlusJakartaSans_800ExtraBold',
  '900': 'PlusJakartaSans_800ExtraBold',
};

function familyFor(style: any): string {
  const flat = StyleSheet.flatten(style) || {};
  // Respect any explicit fontFamily (e.g. @expo/vector-icons set their own).
  if (flat.fontFamily) return flat.fontFamily;
  const w = flat.fontWeight != null ? String(flat.fontWeight) : '400';
  return WEIGHT_TO_FAMILY[w] || 'Inter_400Regular';
}

let patched = false;
export function applyGlobalFont(): void {
  if (patched) return;
  patched = true;
  const patch = (Comp: any) => {
    try {
      const orig = Comp?.render;
      if (typeof orig !== 'function') return;
      Comp.render = function (props: any, ref: any) {
        const fontFamily = familyFor(props?.style);
        // Prepend the default family; the element's own style still wins.
        return orig.call(this, { ...props, style: [{ fontFamily }, props?.style] }, ref);
      };
    } catch {
      // If the component object is frozen, skip silently — text just keeps the
      // system font rather than breaking the app.
    }
  };
  patch(RNText);
  patch(RNTextInput);
}
