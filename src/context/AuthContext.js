import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.error('getSession error:', error.message)
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Ensures a profiles row exists for this user.
  // Called after signup (when session available) and after every sign-in.
  // This is the safety net — the DB trigger is the primary path.
  const ensureProfile = async (authUser) => {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', authUser.id)
      .maybeSingle()

    if (existing) return // already exists, nothing to do

    const meta = authUser.user_metadata || {}
    const { error } = await supabase.from('profiles').insert({
      id: authUser.id,
      email: authUser.email,
      full_name: meta.full_name || '',
      phone: meta.phone || null,
      user_type: meta.user_type || null,
    })

    if (error && error.code !== '23505') {
      // 23505 = unique_violation: concurrent insert won, fine to ignore
      console.error('ensureProfile error:', error.message)
    }
  }

  const signUp = async ({ email, password, userType, fullName, phone }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone, user_type: userType },
      },
    })
    if (error) throw error

    // If email confirmation is OFF, we get a session immediately — create the profile now.
    // If it's ON, session is null; the trigger (or ensureProfile on first sign-in) will handle it.
    if (data.session && data.user) {
      await ensureProfile(data.user)
    }

    return { needsEmailConfirmation: !data.session }
  }

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    // Always ensure profile exists on sign-in.
    // This covers: email-confirmed accounts that signed up before the trigger was added,
    // and any other edge case where the profile row is missing.
    if (data.user) {
      await ensureProfile(data.user)
    }

    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthContext
