'use client'

import Link from 'next/link'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Lightbulb, PlusCircle } from 'lucide-react'
import ThemeToggle from '@/components/common/theme-toggle'

export default function Header() {
  const { user, isLoading } = useAuth()

  return (
    <header className="fixed top-0 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <img src="/logo.svg"/>
            <span className="hidden sm:block">The Unfair Advantage</span>
            <span className="sm:hidden">TUA</span>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* New Analysis Button for authenticated users */}
      

            <ThemeToggle />

            {/* Authentication Buttons */}
            {isLoading ? (
              <div className="h-9 w-20 bg-muted rounded animate-pulse" />
            ) : user ? (
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard">
                  Dashboard
                </Link>
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/login">Sign in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth/register">Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
