import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'
import { useUser } from '../context/UserContext'

export const useBookings = () => {
  const { user } = useAuth()
  const { profile } = useUser()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchBookings = useCallback(async () => {
    if (!user || !profile) return
    setLoading(true)
    try {
      const field = profile.user_type === 'model' ? 'model_id' : 'brand_id'
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq(field, user.id)
        .order('shoot_date', { ascending: true })
      if (error) throw error
      setBookings(data || [])
    } catch (err) {
      console.error('useBookings error:', err.message)
    } finally {
      setLoading(false)
    }
  }, [user, profile])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const createBooking = async (bookingData) => {
    const { data, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single()
    if (error) throw error
    fetchBookings()
    return data
  }

  const updateBookingStatus = async (bookingId, status) => {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)
      .select()
      .single()
    if (error) throw error
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? data : b)))
    return data
  }

  const getPendingBookings = () =>
    bookings.filter((b) => b.status === 'pending')

  const getUpcomingBookings = () => {
    const today = new Date().toISOString().split('T')[0]
    return bookings.filter(
      (b) => (b.status === 'accepted' || b.status === 'confirmed') && b.shoot_date >= today
    )
  }

  const getCompletedBookings = () =>
    bookings.filter((b) => b.status === 'completed')

  return {
    bookings,
    loading,
    fetchBookings,
    createBooking,
    updateBookingStatus,
    getPendingBookings,
    getUpcomingBookings,
    getCompletedBookings,
  }
}
