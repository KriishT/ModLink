import React from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'

import { useAuth } from '../context/AuthContext'
import { useUser } from '../context/UserContext'

import AuthNavigator from './AuthNavigator'
import ModelNavigator from './ModelNavigator'
import BrandNavigator from './BrandNavigator'

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#9B7FE8" />
  </View>
)

const RootNavigator = () => {
  const { user, loading: authLoading } = useAuth()
  const { profile, loadingProfile } = useUser()

  // Wait for auth to initialise
  if (authLoading) return <LoadingScreen />

  // User is logged in — wait for profile fetch to complete before routing
  if (user && loadingProfile) return <LoadingScreen />

  // Derive user type: prefer DB profile, fall back to metadata set at signup
  const userType = profile?.user_type ?? user?.user_metadata?.user_type

  // Still logged in but userType couldn't be determined — wait a beat
  if (user && !userType) return <LoadingScreen />

  const getNavigator = () => {
    if (!user) return <AuthNavigator />
    if (userType === 'model') return <ModelNavigator />
    if (userType === 'brand') return <BrandNavigator />
    // Fallback: logged in but bad state — send back to auth
    return <AuthNavigator />
  }

  return (
    <NavigationContainer>
      {getNavigator()}
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
})

export default RootNavigator
