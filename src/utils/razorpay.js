import { Alert, Linking } from 'react-native'
import { supabase } from './supabase'

// NOTE: For production, replace BACKEND_URL with your actual Supabase Edge Function URL
// e.g., 'https://YOUR_PROJECT.supabase.co/functions/v1'
const BACKEND_URL = 'https://YOUR_PROJECT.supabase.co/functions/v1'
const RAZORPAY_KEY = 'YOUR_RAZORPAY_KEY_ID'

export const PLATFORM_FEE_PERCENT = 0.10

export const calculatePlatformFee = (amount) => Math.round(amount * PLATFORM_FEE_PERCENT)

export const calculateTotal = (amount) => amount + calculatePlatformFee(amount)

export const initiatePayment = async ({ bookingId, amount, modelName, brandName, onSuccess, onFailure }) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    const response = await fetch(`${BACKEND_URL}/create-razorpay-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bookingId, amount: calculateTotal(amount) }),
    })

    if (!response.ok) throw new Error('Failed to create payment order')
    const order = await response.json()

    // In a real app, use react-native-razorpay here
    // For demo/web: open Razorpay checkout link or show payment form
    Alert.alert(
      'Complete Payment',
      `Amount: ₹${calculateTotal(amount).toLocaleString('en-IN')}\nBooking: ${bookingId}\n\nIn production, this opens Razorpay checkout.`,
      [
        {
          text: 'Simulate Success',
          onPress: async () => {
            await handlePaymentSuccess({
              bookingId,
              orderId: order.id,
              paymentId: `pay_${Date.now()}`,
              amount,
            })
            onSuccess && onSuccess({ orderId: order.id })
          },
        },
        { text: 'Cancel', style: 'cancel', onPress: () => onFailure && onFailure('cancelled') },
      ]
    )
  } catch (err) {
    console.error('initiatePayment error:', err.message)
    onFailure && onFailure(err.message)
  }
}

export const handlePaymentSuccess = async ({ bookingId, orderId, paymentId, amount }) => {
  const platformFee = calculatePlatformFee(amount)

  await supabase.from('payments').upsert({
    booking_id: bookingId,
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    amount: calculateTotal(amount),
    status: 'escrowed',
  })

  await supabase.from('bookings').update({
    status: 'confirmed',
    platform_fee: platformFee,
  }).eq('id', bookingId)
}

export const releasePayment = async (bookingId) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    const response = await fetch(`${BACKEND_URL}/release-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bookingId }),
    })

    if (!response.ok) throw new Error('Failed to release payment')

    await supabase.from('payments').update({
      status: 'released',
      released_at: new Date().toISOString(),
    }).eq('booking_id', bookingId)

    await supabase.from('bookings').update({ status: 'completed' }).eq('id', bookingId)

    return true
  } catch (err) {
    console.error('releasePayment error:', err.message)
    throw err
  }
}
