import React, { useState, useRef } from 'react'
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  Dimensions, SafeAreaView, StatusBar, Modal, ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../../theme/colors'
import PrimaryButton from '../../components/PrimaryButton'

const { width, height } = Dimensions.get('window')

export default function PortfolioViewerScreen({ route, navigation }) {
  const { images = [], modelName = '', initialIndex = 0, showBookButton = false, onBook } = route?.params || {}
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const flatListRef = useRef(null)

  const currentImage = images[currentIndex]

  const goTo = (index) => {
    if (index < 0 || index >= images.length) return
    setCurrentIndex(index)
    flatListRef.current?.scrollToIndex({ index, animated: true })
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{modelName || 'Portfolio'}</Text>
        <View style={styles.headerBtn} />
      </View>

      {/* Main image */}
      <FlatList
        ref={flatListRef}
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width)
          setCurrentIndex(idx)
        }}
        keyExtractor={(item, i) => item.id || String(i)}
        renderItem={({ item }) => (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: item.image_url }}
              style={styles.mainImage}
              resizeMode="contain"
            />
          </View>
        )}
      />

      {/* Bottom overlay */}
      <View style={styles.overlay}>
        <View style={styles.dotsRow}>
          {images.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)}>
              <View style={[styles.dot, i === currentIndex && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.counter}>{currentIndex + 1} of {images.length}</Text>
          {currentImage?.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{currentImage.category}</Text>
            </View>
          )}
        </View>

        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
            onPress={() => goTo(currentIndex - 1)}
            disabled={currentIndex === 0}
          >
            <Ionicons name="chevron-back" size={20} color={currentIndex === 0 ? 'rgba(255,255,255,0.3)' : '#fff'} />
            <Text style={[styles.navLabel, currentIndex === 0 && { opacity: 0.3 }]}>Previous</Text>
          </TouchableOpacity>

          {showBookButton && (
            <TouchableOpacity style={styles.bookBtn} onPress={onBook || (() => navigation.goBack())}>
              <Text style={styles.bookBtnText}>Book This Model</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.navBtn, currentIndex === images.length - 1 && styles.navBtnDisabled]}
            onPress={() => goTo(currentIndex + 1)}
            disabled={currentIndex === images.length - 1}
          >
            <Text style={[styles.navLabel, currentIndex === images.length - 1 && { opacity: 0.3 }]}>Next</Text>
            <Ionicons name="chevron-forward" size={20} color={currentIndex === images.length - 1 ? 'rgba(255,255,255,0.3)' : '#fff'} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  headerBtn: { width: 40, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  imageContainer: { width, height: height * 0.7, justifyContent: 'center', alignItems: 'center' },
  mainImage: { width, height: height * 0.7 },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingBottom: 32,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: colors.primaryPale, width: 18, borderRadius: 3 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  counter: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  categoryBadge: { backgroundColor: 'rgba(155,127,232,0.6)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  categoryText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 12 },
  navBtnDisabled: { opacity: 0.3 },
  navLabel: { color: '#fff', fontSize: 14 },
  bookBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
