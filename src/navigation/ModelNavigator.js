import React from 'react'
import { View, StyleSheet } from 'react-native'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useUser } from '../context/UserContext'

import ModelHomeScreen from '../screens/model/ModelHomeScreen'
import ModelDiscoverScreen from '../screens/model/ModelDiscoverScreen'
import MessagesScreen from '../screens/shared/MessagesScreen'
import BookingsScreen from '../screens/shared/BookingsScreen'
import ProfileScreen from '../screens/shared/ProfileScreen'

import ChatScreen from '../screens/shared/ChatScreen'
import BookingDetailScreen from '../screens/shared/BookingDetailScreen'
import ContractScreen from '../screens/shared/ContractScreen'
import ReviewScreen from '../screens/shared/ReviewScreen'
import SafetyCenterScreen from '../screens/shared/SafetyCenterScreen'
import ModelProfileSetupScreen from '../screens/model/ModelProfileSetupScreen'
import ModelVerificationScreen from '../screens/model/ModelVerificationScreen'
import PortfolioViewerScreen from '../screens/model/PortfolioViewerScreen'
import EditProfileScreen from '../screens/shared/EditProfileScreen'

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

const TAB_ACTIVE   = '#7856FF'
const TAB_INACTIVE = '#9897B4'

function TabIcon({ name, focused, color }) {
  return (
    <View style={styles.iconWrap}>
      <Ionicons name={name} size={22} color={color} />
      {focused && <View style={styles.activeDot} />}
    </View>
  )
}

const ModelTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: TAB_ACTIVE,
        tabBarInactiveTintColor: TAB_INACTIVE,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#EAE7F5',
          elevation: 0,
          shadowColor: '#0D0B1F',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          height: 64,
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline'
          } else if (route.name === 'Discover') {
            iconName = focused ? 'heart' : 'heart-outline'
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline'
          } else if (route.name === 'Bookings') {
            iconName = focused ? 'calendar' : 'calendar-outline'
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline'
          }
          return <TabIcon name={iconName} focused={focused} color={color} />
        },
      })}
    >
      <Tab.Screen name="Home" component={ModelHomeScreen} />
      <Tab.Screen name="Discover" component={ModelDiscoverScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

const ModelNavigator = () => {
  const { modelProfile } = useUser()
  const initialRoute = modelProfile ? 'ModelTabs' : 'ModelProfileSetup'

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="ModelTabs" component={ModelTabNavigator} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
      <Stack.Screen name="Contract" component={ContractScreen} />
      <Stack.Screen name="Review" component={ReviewScreen} />
      <Stack.Screen name="SafetyCenter" component={SafetyCenterScreen} />
      <Stack.Screen name="ModelProfileSetup" component={ModelProfileSetupScreen} />
      <Stack.Screen name="ModelVerification" component={ModelVerificationScreen} />
      <Stack.Screen name="PortfolioViewer" component={PortfolioViewerScreen} />
      <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
    </Stack.Navigator>
  )
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    gap: 4,
    paddingTop: 10,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: TAB_ACTIVE,
  },
})

export default ModelNavigator
