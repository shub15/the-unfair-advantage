'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { 
  BarChart3,  
  History, 
  Users, 
  Lightbulb,
  PlusCircle,
  LogOut,
  MessageSquare,
  Clock,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

// Simplified navigation items for entrepreneurs
const entrepreneurNavItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3
  },
  {
    title: 'History',
    href: '/dashboard/history',
    icon: History
  },
  {
    title: 'Find Mentors',
    href: '/mentors',
    icon: Users
  }
]

// Simplified navigation items for mentors
const mentorNavItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3
  },
  {
    title: 'Review Queue',
    href: '/mentor/reviews',
    icon: Clock
  },
  {
    title: 'My Students',
    href: '/mentor/students',
    icon: Users
  },
  {
    title: 'Messages',
    href: '/mentor/messages',
    icon: MessageSquare
  }
]

export default function HoverSidebar() {
  const [isHovered, setIsHovered] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, signOut } = useAuth()

  // Get navigation items based on user role
  const navigationItems = profile?.role === 'mentor' ? mentorNavItems : entrepreneurNavItems

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
  }

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      console.log('Initiating sign out...')
      
      await signOut()
      
      // Additional cleanup if needed
      console.log('Sign out completed')
      
    } catch (error: any) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out completely, but you have been logged out')
      
      // Force redirect even if there's an error
      router.push('/')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div 
      className={cn(
        "fixed inset-y-0 left-0 z-50 bg-card border-r transition-all duration-300 ease-out",
        isHovered ? "w-64" : "w-16"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b">
        <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
          <Lightbulb className="h-5 w-5 text-primary-foreground" />
        </div>
        
        {isHovered && (
          <div className="ml-3 opacity-100 transition-opacity duration-300">
            <h2 className="font-bold text-lg">TUA</h2>
          </div>
        )}
      </div>

      {/* Quick Action Button */}
      <div className="p-3">
        <Link href="/evaluate">
          <Button className={cn("w-full", !isHovered && "px-0")}>
            <PlusCircle className="h-4 w-4" />
            {isHovered && <span className="ml-2">New Evaluation</span>}
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || 
                           (pathname.startsWith(item.href) && item.href !== '/dashboard')

            return (
              <div key={item.href} className="relative group">
                <Link href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      !isHovered && "px-0 justify-center",
                      isActive && "bg-primary/10 text-primary"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {isHovered && <span className="ml-3">{item.title}</span>}
                  </Button>
                </Link>
                
                {/* Tooltip for collapsed state */}
                {!isHovered && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded border shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                    {item.title}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* User Profile */}
      <div className="p-3 border-t">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={profile?.avatar_url} alt={profile?.name} />
            <AvatarFallback className="text-xs">
              {getInitials(profile?.name || '')}
            </AvatarFallback>
          </Avatar>
          
          {isHovered && (
            <div className="flex-1 min-w-0 opacity-100 transition-opacity duration-300">
              <p className="text-sm font-medium truncate">{profile?.name}</p>
              <Badge variant="outline" className="text-xs mt-1">
                {profile?.role}
              </Badge>
            </div>
          )}
        </div>
        
        {/* Sign Out Button - Expanded State */}
        {isHovered && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-3 justify-start text-muted-foreground hover:text-destructive"
                disabled={isSigningOut}
              >
                {isSigningOut ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing out...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sign out of your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will be redirected to the home page and will need to sign in again to access your account.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isSigningOut ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signing out...
                    </>
                  ) : (
                    'Sign Out'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        
        {/* Sign Out Button - Collapsed State */}
        {!isHovered && (
          <div className="flex justify-center mt-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  disabled={isSigningOut}
                >
                  {isSigningOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign out of your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will be redirected to the home page and will need to sign in again to access your account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isSigningOut ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Signing out...
                      </>
                    ) : (
                      'Sign Out'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  )
}
