import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View, Dimensions } from 'react-native'
import { ModLinkMark } from '../../components/ModLinkLogo'

const { width: W } = Dimensions.get('window')
const DARK   = '#0D0B1F'
const PURPLE = '#7856FF'

export default function SplashScreen({ navigation }) {
  const fadeAnim    = useRef(new Animated.Value(0)).current
  const slideAnim   = useRef(new Animated.Value(32)).current
  const tagFade     = useRef(new Animated.Value(0)).current
  const accentScale = useRef(new Animated.Value(0)).current
  const bottomFade  = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim,    { toValue: 1, duration: 640, useNativeDriver: true }),
        Animated.timing(slideAnim,   { toValue: 0, duration: 640, useNativeDriver: true }),
        Animated.timing(accentScale, { toValue: 1, duration: 480, delay: 120, useNativeDriver: true }),
      ]),
      Animated.delay(160),
      Animated.parallel([
        Animated.timing(tagFade,    { toValue: 1, duration: 440, useNativeDriver: true }),
        Animated.timing(bottomFade, { toValue: 1, duration: 440, useNativeDriver: true }),
      ]),
    ]).start()

    const timer = setTimeout(() => navigation.replace('Onboarding'), 3000)
    return () => clearTimeout(timer)
  }, [fadeAnim, slideAnim, tagFade, accentScale, bottomFade, navigation])

  return (
    <View style={styles.container}>
      {/* Top accent bar */}
      <Animated.View style={[styles.topBar, { transform: [{ scaleX: accentScale }] }]} />

      {/* Center content */}
      <Animated.View
        style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <ModLinkMark size={68} variant="light" />

        <View style={styles.wordmarkRow}>
          <Text style={styles.wordMod}>mod</Text>
          <Text style={styles.wordLink}>link</Text>
        </View>

        <Animated.View style={[styles.taglineWrap, { opacity: tagFade }]}>
          <View style={styles.taglineLine} />
          <Text style={styles.tagline}>WHERE FASHION MEETS OPPORTUNITY</Text>
          <View style={styles.taglineLine} />
        </Animated.View>
      </Animated.View>

      {/* Subtle decorative vertical lines */}
      <View style={styles.gridLine} pointerEvents="none" />
      <View style={[styles.gridLine, styles.gridLineRight]} pointerEvents="none" />

      {/* Bottom */}
      <Animated.View style={[styles.bottom, { opacity: bottomFade }]}>
        <View style={styles.bottomDot} />
        <Text style={styles.bottomText}>INDIA'S FASHION MARKETPLACE</Text>
        <View style={styles.bottomDot} />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: DARK,
    alignItems: 'center', justifyContent: 'center',
  },

  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 2, backgroundColor: PURPLE,
  },

  content: { alignItems: 'center', gap: 22 },

  wordmarkRow: { flexDirection: 'row', alignItems: 'baseline' },
  wordMod: {
    fontSize: 46, fontWeight: '300',
    color: 'rgba(255,255,255,0.5)', letterSpacing: -0.6,
  },
  wordLink: {
    fontSize: 46, fontWeight: '900',
    color: '#FFFFFF', letterSpacing: -1.4,
  },

  taglineWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2,
  },
  taglineLine: { width: 40, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  tagline: {
    fontSize: 9, color: 'rgba(255,255,255,0.28)',
    letterSpacing: 2.4, fontWeight: '600',
  },

  gridLine: {
    position: 'absolute', left: W * 0.12, top: 0, bottom: 0,
    width: 1, backgroundColor: 'rgba(255,255,255,0.025)',
  },
  gridLineRight: { left: W * 0.88 },

  bottom: {
    position: 'absolute', bottom: 48,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  bottomDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)' },
  bottomText: {
    fontSize: 9, color: 'rgba(255,255,255,0.18)',
    letterSpacing: 3, fontWeight: '600',
  },
})
