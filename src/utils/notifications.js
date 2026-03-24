import * as Notifications from 'expo-notifications'
import { supabase } from './supabase'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export const registerForPushNotifications = async (userId) => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted')
    return null
  }

  const tokenData = await Notifications.getExpoPushTokenAsync()
  const token = tokenData.data

  if (userId) {
    await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', userId)
  }

  return token
}

export const scheduleLocalNotification = async ({ title, body, data = {}, trigger = null }) => {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data },
    trigger: trigger || { seconds: 1 },
  })
}

export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync()
}

export const addNotificationListener = (handler) => {
  return Notifications.addNotificationReceivedListener(handler)
}

export const addNotificationResponseListener = (handler) => {
  return Notifications.addNotificationResponseReceivedListener(handler)
}

export const NOTIFICATION_TYPES = {
  NEW_MATCH: 'new_match',
  NEW_MESSAGE: 'new_message',
  BOOKING_REQUEST: 'booking_request',
  BOOKING_ACCEPTED: 'booking_accepted',
  PAYMENT_RECEIVED: 'payment_received',
  REVIEW_RECEIVED: 'review_received',
  MATCH_EXPIRING: 'match_expiring',
  VERIFICATION_APPROVED: 'verification_approved',
}
