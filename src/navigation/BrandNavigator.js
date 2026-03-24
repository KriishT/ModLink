import React from 'react'
import { View, StyleSheet } from 'react-native'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useUser } from '../context/UserContext'

import BrandHomeScreen from '../screens/brand/BrandHomeScreen'
import BrandDiscoverScreen from '../screens/brand/BrandDiscoverScreen'
import PostJobScreen from '../screens/brand/PostJobScreen'
import MessagesScreen from '../screens/shared/MessagesScreen'
import ProfileScreen from '../screens/shared/ProfileScreen'

import ChatScreen from '../screens/shared/ChatScreen'
import BookingDetailScreen from '../screens/shared/BookingDetailScreen'
import ContractScreen from '../screens/shared/ContractScreen'
import ReviewScreen from '../screens/shared/ReviewScreen'
import SafetyCenterScreen from '../screens/shared/SafetyCenterScreen'
import BrandProfileSetupScreen from '../screens/brand/BrandProfileSetupScreen'
import ApplicationsScreen from '../screens/brand/ApplicationsScreen'
import ContentDeliveryScreen from '../screens/brand/ContentDeliveryScreen'
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

const BrandTabNavigator = () => {
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
            iconName = focused ? 'search' : 'search-outline'
          } else if (route.name === 'PostJob') {
            iconName = focused ? 'add-circle' : 'add-circle-outline'
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline'
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline'
          }
          return <TabIcon name={iconName} focused={focused} color={color} />
        },
      })}
    >
      <Tab.Screen name="Home" component={BrandHomeScreen} />
      <Tab.Screen name="Discover" component={BrandDiscoverScreen} />
      <Tab.Screen
        name="PostJob"
        component={PostJobScreen}
        options={{ tabBarLabel: 'Post Job' }}
      />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

const BrandNavigator = () => {
  const { brandProfile } = useUser()
  const initialRoute = brandProfile ? 'BrandTabs' : 'BrandProfileSetup'

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="BrandTabs" component={BrandTabNavigator} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
      <Stack.Screen name="Contract" component={ContractScreen} />
      <Stack.Screen name="Review" component={ReviewScreen} />
      <Stack.Screen name="SafetyCenter" component={SafetyCenterScreen} />
      <Stack.Screen name="BrandProfileSetup" component={BrandProfileSetupScreen} />
      <Stack.Screen name="Applications" component={ApplicationsScreen} />
      <Stack.Screen name="ContentDelivery" component={ContentDeliveryScreen} />
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

export default BrandNavigator
