import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'
import { useAuth } from './AuthContext'

const UserContext = createContext({})

export const UserProvider = ({ children }) => {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [modelProfile, setModelProfile] = useState(null)
  const [brandProfile, setBrandProfile] = useState(null)
  // Start as true so RootNavigator waits before rendering on app load
  const [loadingProfile, setLoadingProfile] = useState(true)

  useEffect(() => {
    if (user) {
      // Set loading synchronously before the async fetch to prevent race condition
      setLoadingProfile(true)
      fetchProfile()
    } else {
      setProfile(null)
      setModelProfile(null)
      setBrandProfile(null)
      setLoadingProfile(false)
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      // Use maybeSingle() — returns null (not an error) when no row exists yet
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error) throw error

      setProfile(data)

      if (data?.user_type === 'model') {
        const { data: mp } = await supabase
          .from('model_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
        setModelProfile(mp)
      } else if (data?.user_type === 'brand') {
        const { data: bp } = await supabase
          .from('brand_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
        setBrandProfile(bp)
      }
    } catch (err) {
      console.error('fetchProfile error:', err.message)
    } finally {
      setLoadingProfile(false)
    }
  }

  const updateProfile = async (updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    if (error) throw error
    setProfile(data)
    return data
  }

  const updateModelProfile = async (updates) => {
    const { data, error } = await supabase
      .from('model_profiles')
      .upsert({ id: user.id, ...updates })
      .select()
      .single()
    if (error) throw error
    setModelProfile(data)
    return data
  }

  const updateBrandProfile = async (updates) => {
    const { data, error } = await supabase
      .from('brand_profiles')
      .upsert({ id: user.id, ...updates })
      .select()
      .single()
    if (error) throw error
    setBrandProfile(data)
    return data
  }

  return (
    <UserContext.Provider value={{
      profile,
      modelProfile,
      brandProfile,
      loadingProfile,
      fetchProfile,
      updateProfile,
      updateModelProfile,
      updateBrandProfile,
    }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}

export default UserContext
