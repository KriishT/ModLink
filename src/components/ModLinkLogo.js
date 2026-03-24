import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PURPLE = '#7856FF';
const DARK = '#0D0B1F';
const WHITE = '#FFFFFF';

/**
 * The "M·" mark — a dark rounded square with the letter M
 * plus a two-dot link chain beside it.
 *
 * variant: 'dark'  → dark square on a light background
 *          'light' → ghost square on a dark background
 *          'purple'→ purple-filled square (accent context)
 */
export function ModLinkMark({ size = 36, variant = 'dark' }) {
  const bg =
    variant === 'light'
      ? 'rgba(255,255,255,0.14)'
      : variant === 'purple'
      ? PURPLE
      : DARK;

  const letterColor =
    variant === 'dark' ? PURPLE : WHITE;

  const dotBg =
    variant === 'light' ? 'rgba(255,255,255,0.55)' : PURPLE;

  const dotBg2 =
    variant === 'light' ? 'rgba(255,255,255,0.28)' : 'rgba(120,86,255,0.45)';

  const borderColor =
    variant === 'light' ? 'rgba(255,255,255,0.18)' : 'transparent';

  const dotSize = Math.round(size * 0.18);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Math.round(size * 0.1) }}>
      {/* Letter square */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.28),
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: variant === 'light' ? 1 : 0,
          borderColor,
        }}
      >
        <Text
          style={{
            fontSize: Math.round(size * 0.52),
            fontWeight: '900',
            color: letterColor,
            letterSpacing: -1,
            lineHeight: Math.round(size * 0.65),
          }}
        >
          M
        </Text>
      </View>

      {/* Chain-link dots */}
      <View style={{ gap: Math.round(size * 0.1) }}>
        <View
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: dotBg,
          }}
        />
        <View
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: dotBg2,
          }}
        />
      </View>
    </View>
  );
}

/**
 * Typographic wordmark: "mod" in regular/secondary colour +
 * "link" in 900-weight primary colour.
 */
export function ModLinkWordmark({ size = 22, variant = 'dark' }) {
  const modColor = variant === 'light' ? 'rgba(255,255,255,0.65)' : DARK;
  const linkColor = variant === 'light' ? WHITE : PURPLE;

  return (
    <Text
      style={{
        fontSize: size,
        letterSpacing: -0.4,
        lineHeight: size * 1.15,
        includeFontPadding: false,
      }}
    >
      <Text style={{ fontWeight: '400', color: modColor }}>mod</Text>
      <Text style={{ fontWeight: '900', color: linkColor }}>link</Text>
    </Text>
  );
}

/**
 * Full logo: mark + wordmark side by side.
 */
export default function ModLinkLogo({
  markSize = 36,
  wordmarkSize = 22,
  showWordmark = true,
  variant = 'dark',
  gap = 10,
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap }}>
      <ModLinkMark size={markSize} variant={variant} />
      {showWordmark && (
        <ModLinkWordmark size={wordmarkSize} variant={variant} />
      )}
    </View>
  );
}
