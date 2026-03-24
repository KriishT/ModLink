import * as ImagePicker from 'expo-image-picker'
import { supabase } from './supabase'

export const requestMediaPermissions = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
  return status === 'granted'
}

export const requestCameraPermissions = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync()
  return status === 'granted'
}

export const pickImageFromLibrary = async (options = {}) => {
  const granted = await requestMediaPermissions()
  if (!granted) throw new Error('Media library permission denied')

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: options.crop !== false,
    aspect: options.aspect || [3, 4],
    quality: options.quality || 0.8,
    allowsMultipleSelection: options.multiple || false,
    ...options,
  })

  if (result.canceled) return null
  return options.multiple ? result.assets : result.assets[0]
}

export const pickMultipleImages = async (options = {}) => {
  return pickImageFromLibrary({ ...options, multiple: true })
}

export const takePhoto = async (options = {}) => {
  const granted = await requestCameraPermissions()
  if (!granted) throw new Error('Camera permission denied')

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [3, 4],
    quality: 0.8,
    ...options,
  })

  if (result.canceled) return null
  return result.assets[0]
}

export const uploadImageToSupabase = async (imageAsset, bucket, path) => {
  const response = await fetch(imageAsset.uri)
  const blob = await response.blob()

  const fileName = path || `${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, blob, {
      contentType: imageAsset.type || 'image/jpeg',
      upsert: false,
    })

  if (error) throw error

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return publicUrlData.publicUrl
}

export const uploadPortfolioImage = async (userId, imageAsset, category = 'general') => {
  const path = `${userId}/${Date.now()}.jpg`
  const publicUrl = await uploadImageToSupabase(imageAsset, 'portfolios', path)

  const { data, error } = await supabase.from('portfolio_images').insert({
    model_id: userId,
    image_url: publicUrl,
    category,
  }).select().single()

  if (error) throw error
  return data
}

export const deletePortfolioImage = async (imageId, imageUrl) => {
  const path = imageUrl.split('/portfolios/')[1]
  if (path) {
    await supabase.storage.from('portfolios').remove([path])
  }
  const { error } = await supabase.from('portfolio_images').delete().eq('id', imageId)
  if (error) throw error
}

export const uploadProfileImage = async (userId, imageAsset) => {
  const path = `profiles/${userId}.jpg`
  const publicUrl = await uploadImageToSupabase(imageAsset, 'avatars', path)

  await supabase.from('profiles').update({ profile_image_url: publicUrl }).eq('id', userId)
  return publicUrl
}
