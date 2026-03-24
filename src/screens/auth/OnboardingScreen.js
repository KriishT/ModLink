import React, { useRef, useState } from 'react'
import {
  Animated, Dimensions, ScrollView, StyleSheet,
  Text, TouchableOpacity, View, StatusBar,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ModLinkWordmark } from '../../components/ModLinkLogo'

const { width: W, height: H } = Dimensions.get('window')
const DARK   = '#0D0B1F'
const PURPLE = '#7856FF'

const SLIDES = [
  {
    number:   '01',
    icon:     'people',
    headline: 'Connect Directly\nWith Brands',
    subtext:  'No agencies. No commissions.\nJust real opportunities — direct.',
    accent:   PURPLE,
    accentLight: '#EDE8FF',
  },
  {
    number:   '02',
    icon:     'document-text',
    headline: 'Every Booking\nFully Protected',
    subtext:  'Safe, clear, and legally binding\ncontracts on every shoot.',
    accent:   '#E84B78',
    accentLight: '#FDE8EF',
  },
  {
    number:   '03',
    icon:     'card',
    headline: 'Get Paid\nOn Time',
    subtext:  'Payments secured in escrow\nbefore every shoot, always.',
    accent:   '#12C99F',
    accentLight: '#E2FBF5',
  },
]

export default function OnboardingScreen({ navigation }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollRef = useRef(null)
  const dotAnim = useRef(SLIDES.map(() => new Animated.Value(0))).current

  const handleScroll = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / W)
    setActiveIndex(index)
  }

  const isLast = activeIndex === SLIDES.length - 1
  const current = SLIDES[activeIndex]

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <ModLinkWordmark size={18} variant="light" />
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={styles.slide}>
            {/* Icon */}
            <View style={styles.iconArea}>
              <View style={[styles.iconOuter, { backgroundColor: slide.accentLight + '30' }]}>
                <View style={[styles.iconInner, { backgroundColor: slide.accentLight }]}>
                  <Ionicons name={slide.icon} size={36} color={slide.accent} />
                </View>
              </View>
              <View style={styles.numberRow}>
                <View style={[styles.numberLine, { backgroundColor: slide.accent }]} />
                <Text style={styles.numberText}>{slide.number}</Text>
              </View>
            </View>

            <Text style={styles.headline}>{slide.headline}</Text>
            <Text style={styles.subtext}>{slide.subtext}</Text>

            {/* Decorative accent line */}
            <View style={[styles.accentBar, { backgroundColor: slide.accent }]} />
          </View>
        ))}
      </ScrollView>

      {/* Bottom controls */}
      <View style={styles.bottom}>
        {/* Dot indicators */}
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex
                  ? [styles.dotActive, { backgroundColor: current.accent }]
                  : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* CTA button */}
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: current.accent }]}
          onPress={() => navigation.navigate('SignUp')}
          activeOpacity={0.88}
        >
          <Text style={styles.ctaText}>{isLast ? 'Get Started' : 'Continue'}</Text>
          <Ionicons name="arrow-forward" size={17} color="#fff" />
        </TouchableOpacity>

        {/* Sign in */}
        <TouchableOpacity onPress={() => navigation.navigate('SignIn')} style={styles.signInRow}>
          <Text style={styles.signInText}>
            Already have an account?{'  '}
            <Text style={styles.signInBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK },

  topBar: {
    position: 'absolute', top: 56, left: 24, right: 24,
    zIndex: 10, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  skipBtn: {
    paddingVertical: 6, paddingHorizontal: 14,
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  skipText: { color: 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: '600' },

  slide: {
    width: W, height: H,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingBottom: 260,
    paddingTop: 120,
    gap: 22,
  },

  iconArea: {
    flexDirection: 'row', alignItems: 'center',
    gap: 20, marginBottom: 8,
  },
  iconOuter: {
    width: 88, height: 88, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  iconInner: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  numberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  numberLine: { width: 18, height: 2, borderRadius: 1 },
  numberText: {
    fontSize: 12, fontWeight: '700',
    color: 'rgba(255,255,255,0.3)', letterSpacing: 1.8,
  },

  headline: {
    fontSize: 42, fontWeight: '900', color: '#FFFFFF',
    letterSpacing: -1.4, lineHeight: 50,
  },
  subtext: {
    fontSize: 16, color: 'rgba(255,255,255,0.45)',
    lineHeight: 26, fontWeight: '400',
  },

  accentBar: {
    width: 48, height: 3, borderRadius: 2, marginTop: 4,
  },

  bottom: {
    position: 'absolute', bottom: 0,
    left: 0, right: 0,
    paddingBottom: 52, paddingHorizontal: 24,
    alignItems: 'center', gap: 16,
  },
  dots: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  dot: { height: 4, borderRadius: 2 },
  dotActive: { width: 28 },
  dotInactive: { width: 8, backgroundColor: 'rgba(255,255,255,0.2)' },

  cta: {
    width: '100%', height: 56, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },

  signInRow: { paddingVertical: 4 },
  signInText: { color: 'rgba(255,255,255,0.38)', fontSize: 14 },
  signInBold: { fontWeight: '700', color: '#A689FF' },
})
