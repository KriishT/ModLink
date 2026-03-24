import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'
import { useUser } from '../context/UserContext'

export const useMatches = () => {
  const { user } = useAuth()
  const { profile } = useUser()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchMatches = useCallback(async () => {
    if (!user || !profile) return
    setLoading(true)
    try {
      let query
      if (profile.user_type === 'model') {
        query = supabase
          .from('matches')
          .select(`
            *,
            brand:brand_id (
              id,
              brand_profiles (brand_name, bio),
              profiles (full_name, profile_image_url, average_rating)
            )
          `)
          .eq('model_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
      } else {
        query = supabase
          .from('matches')
          .select(`
            *,
            model:model_id (
              id,
              model_profiles (bio, categories, rate_half_day),
              profiles (full_name, profile_image_url, average_rating)
            )
          `)
          .eq('brand_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
      }
      const { data, error } = await query
      if (error) throw error
      setMatches(data || [])
    } catch (err) {
      console.error('useMatches error:', err.message)
    } finally {
      setLoading(false)
    }
  }, [user, profile])

  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

  const handleLike = async (targetUserId) => {
    if (!user || !profile) return null

    try {
      await supabase.from('swipes').upsert({
        swiper_id: user.id,
        swiped_id: targetUserId,
        swipe_type: 'like',
      })

      const { data: mutualLike } = await supabase
        .from('swipes')
        .select('*')
        .eq('swiper_id', targetUserId)
        .eq('swiped_id', user.id)
        .eq('swipe_type', 'like')
        .single()

      if (mutualLike) {
        const matchData = {
          model_id: profile.user_type === 'model' ? user.id : targetUserId,
          brand_id: profile.user_type === 'brand' ? user.id : targetUserId,
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          status: 'active',
        }

        const { data: newMatch, error } = await supabase
          .from('matches')
          .upsert(matchData)
          .select()
          .single()

        if (error) throw error
        fetchMatches()
        return newMatch
      }

      return null
    } catch (err) {
      console.error('handleLike error:', err.message)
      return null
    }
  }

  const handlePass = async (targetUserId) => {
    if (!user) return
    try {
      await supabase.from('swipes').upsert({
        swiper_id: user.id,
        swiped_id: targetUserId,
        swipe_type: 'pass',
      })
    } catch (err) {
      console.error('handlePass error:', err.message)
    }
  }

  const unmatch = async (matchId) => {
    try {
      await supabase.from('matches').update({ status: 'unmatched' }).eq('id', matchId)
      setMatches((prev) => prev.filter((m) => m.id !== matchId))
    } catch (err) {
      console.error('unmatch error:', err.message)
    }
  }

  return { matches, loading, fetchMatches, handleLike, handlePass, unmatch }
}
