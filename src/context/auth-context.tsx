'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Models } from 'appwrite'
import { authService } from '@/lib/appwrite'
import { toast } from 'sonner'

interface User extends Models.User<Models.Preferences> {
  profile?: {
    name: string
    avatar?: string
    role: 'entrepreneur' | 'mentor' | 'admin'
    preferredLanguage: string
  }
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  loginWithGoogle: () => void
  recoverPassword: (email: string) => Promise<void>
  updateProfile: (data: Partial<User['profile']>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuthUser = async () => {
    try {
      const currentAccount = await authService.getCurrentUser()
      
      if (currentAccount) {
        const userProfile = await authService.getUserProfile(currentAccount.$id)
        
        setUser({
          ...currentAccount,
          profile: userProfile ? {
            name: userProfile.name,
            avatar: userProfile.avatar,
            role: userProfile.role,
            preferredLanguage: userProfile.preferredLanguage
          } : undefined
        })
      }
    } catch (error) {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      await authService.login(email, password)
      await checkAuthUser()
      toast.success('Welcome back!')
    } catch (error: any) {
      toast.error(error.message || 'Login failed')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true)
      await authService.register(email, password, name)
      await checkAuthUser()
      toast.success('Account created successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Registration failed')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
      setUser(null)
      toast.success('Logged out successfully')
    } catch (error: any) {
      toast.error('Logout failed')
    }
  }

  const loginWithGoogle = () => {
    authService.loginWithGoogle()
  }

  const recoverPassword = async (email: string) => {
    try {
      await authService.recoverPassword(email)
      toast.success('Password recovery email sent!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send recovery email')
      throw error
    }
  }

  const updateProfile = async (data: Partial<User['profile']>) => {
    if (!user) return
    
    try {
      await authService.updateUserProfile(user.$id, data)
      await checkAuthUser()
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      toast.error('Failed to update profile')
      throw error
    }
  }

  useEffect(() => {
    checkAuthUser()
  }, [])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    loginWithGoogle,
    recoverPassword,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
