import React, { useCallback } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 2;
const GAP = 4;
const ITEM_WIDTH = (SCREEN_WIDTH - GAP * (NUM_COLUMNS + 1)) / NUM_COLUMNS;
// 3:4 portrait aspect ratio
const ITEM_HEIGHT = (ITEM_WIDTH * 4) / 3;

const ADD_PHOTO_SENTINEL = '__ADD_PHOTO__';

function ImageItem({ item, onImagePress, onDeletePress, editable }) {
  return (
    <TouchableOpacity
      style={styles.imageItem}
      onPress={() => onImagePress && onImagePress(item)}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: item.image_url }}
        style={styles.image}
        resizeMode="cover"
      />
      {item.category ? (
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText} numberOfLines={1}>
            {item.category}
          </Text>
        </View>
      ) : null}
      {editable ? (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDeletePress && onDeletePress(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View style={styles.deleteInner}>
            <Ionicons name="close" size={12} color={colors.surface} />
          </View>
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}

function AddPhotoItem({ onAddPress }) {
  return (
    <TouchableOpacity
      style={styles.addPhotoItem}
      onPress={onAddPress}
      activeOpacity={0.75}
    >
      <View style={styles.addPhotoInner}>
        <View style={styles.addIconCircle}>
          <Ionicons name="add" size={28} color={colors.primary} />
        </View>
        <Text style={styles.addPhotoText}>Add Photo</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function PortfolioGrid({
  images = [],
  onImagePress,
  onAddPress,
  onDeletePress,
  editable = false,
}) {
  // Build data list; append sentinel add-photo card when editable
  const data = editable
    ? [...images, { id: ADD_PHOTO_SENTINEL, _sentinel: true }]
    : images;

  const renderItem = useCallback(
    ({ item }) => {
      if (item._sentinel) {
        return <AddPhotoItem onAddPress={onAddPress} />;
      }
      return (
        <ImageItem
          item={item}
          onImagePress={onImagePress}
          onDeletePress={onDeletePress}
          editable={editable}
        />
      );
    },
    [onImagePress, onAddPress, onDeletePress, editable]
  );

  const keyExtractor = useCallback((item) => String(item.id), []);

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="images-outline" size={48} color={colors.border} />
        <Text style={styles.emptyText}>No portfolio images yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={NUM_COLUMNS}
      scrollEnabled={false}
      contentContainerStyle={styles.listContent}
      columnWrapperStyle={styles.columnWrapper}
      ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: GAP,
    gap: GAP,
  },
  columnWrapper: {
    gap: GAP,
  },
  imageItem: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.border,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  categoryText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '600',
  },
  deleteButton: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  deleteInner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoItem: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    borderRadius: 8,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primaryPale,
    borderStyle: 'dashed',
  },
  addPhotoInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  addPhotoText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
  },
});
