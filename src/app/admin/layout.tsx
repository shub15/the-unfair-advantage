'use client'

import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AdminSidebar from '@/components/layout/admin-sidebar'
import LoadingSpinner from '@/components/common/loading-spinner'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    } else if (!isLoading && user && profile?.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [user, profile, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" text="Loading admin panel..." />
      </div>
    )
  }

  if (!user || profile?.role !== 'admin') {
    return null // Will redirect
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <AdminSidebar />
      <div className="flex-1 ml-16 lg:ml-64 overflow-auto">
        {children}
      </div>
    </div>
  )
}
