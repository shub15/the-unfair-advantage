'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface UserProfile {
  id: string
  name: string
  email: string
  avatar_url?: string
  role: 'entrepreneur' | 'mentor' | 'admin'
  preferred_language: string
  bio?: string
  location?: string
  website?: string
  created_at: string
  updated_at: string
}

interface AuthUser extends User {
  profile?: UserProfile
}

interface AuthContextType {
  user: AuthUser | null
  profile: UserProfile | null
  isLoading: boolean
  signUp: (email: string, password: string, name: string) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email || 'No session')
      if (session?.user) {
        loadUserProfile(session.user)
      } else {
        setIsLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email || 'No user')
      
      if (session?.user) {
        await loadUserProfile(session.user)
      } else {
        setUser(null)
        setProfile(null)
        setIsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (authUser: User) => {
    try {
      console.log('Loading profile for user:', authUser.id)
      
      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading profile:', error)
        toast.error('Failed to load user profile')
      }
      
      // If no profile exists, create one
      if (!profileData) {
        console.log('No profile found, creating one...')
        await createUserProfile(authUser)
        return
      }

      console.log('Profile loaded:', profileData.name)
      setUser({ ...authUser, profile: profileData })
      setProfile(profileData)
      
    } catch (error) {
      console.error('Error in loadUserProfile:', error)
      setUser(authUser)
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }

  const createUserProfile = async (authUser: User) => {
    try {
      const profileData = {
        id: authUser.id,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email!,
        avatar_url: authUser.user_metadata?.avatar_url || null,
        role: 'entrepreneur' as const,
        preferred_language: 'en'
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .insert(profileData)
        .select()
        .single()

      if (error) {
        console.error('Error creating profile:', error)
        setUser(authUser)
        setProfile(null)
      } else {
        console.log('Profile created:', data.name)
        setUser({ ...authUser, profile: data })
        setProfile(data)
      }
    } catch (error) {
      console.error('Error in createUserProfile:', error)
      setUser(authUser)
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('Attempting signup for:', email)
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: name.trim()
          }
        }
      })

      if (error) {
        console.error('Signup error:', error)
        throw error
      }

      console.log('Signup successful:', data)
      return data
      
    } catch (error: any) {
      console.error('SignUp failed:', error)
      throw new Error(error.message || 'Failed to create account')
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)
  
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
  
      if (error) throw error
  
      if (data.user) {
        // Fetch user profile to determine role
        const userProfile = await fetchUserProfile(data.user.id)
        
        // Role-based redirect
        if (userProfile?.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
      }
  
      return data
    } catch (error) {
      setIsLoading(false)
      throw error
    }
  }
  

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      console.log('Signed out successfully')
      toast.success('Signed out successfully')
    } catch (error: any) {
      console.error('Signout error:', error)
      throw error
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in')

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      
      setProfile(data)
      setUser({ ...user, profile: data })
      
      toast.success('Profile updated successfully')
    } catch (error: any) {
      console.error('Update profile error:', error)
      throw new Error('Failed to update profile')
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isLoading,
      signUp,
      signIn,
      signOut,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
