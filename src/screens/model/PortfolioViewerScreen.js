import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'

const { width, height } = Dimensions.get('window')

const PortfolioViewerScreen = ({ navigation, route }) => {
  const { images = [], modelName = 'Portfolio', initialIndex = 0 } = route.params || {}
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  const renderItem = ({ item, index }) => (
    <View style={styles.imageContainer}>
      <Image
        source={{ uri: item.image_url || item }}
        style={styles.fullImage}
        resizeMode="cover"
      />
      {item.category && (
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      )}
    </View>
  )

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{modelName}</Text>
        <Text style={styles.counter}>
          {currentIndex + 1} / {images.length}
        </Text>
      </SafeAreaView>

      {/* Images */}
      <FlatList
        data={images}
        renderItem={renderItem}
        keyExtractor={(_, i) => i.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width)
          setCurrentIndex(index)
        }}
      />

      {/* Dots */}
      <SafeAreaView style={styles.dotsContainer}>
        <View style={styles.dots}>
          {images.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentIndex && styles.dotActive]}
            />
          ))}
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    ...typography.heading,
    color: '#FFFFFF',
    fontSize: 18,
  },
  counter: {
    ...typography.body,
    color: '#FFFFFF',
    fontSize: 14,
  },
  imageContainer: {
    width,
    height,
  },
  fullImage: {
    width,
    height,
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 16,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 18,
  },
})

export default PortfolioViewerScreen
