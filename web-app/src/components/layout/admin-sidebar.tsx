'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  BarChart3, 
  FileText, 
  Users,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  Activity,
  TrendingUp,
  Download,
  Clock,
  CheckCircle,
  AlertTriangle,
  LogOut
} from 'lucide-react'
import { toast } from 'sonner'

const adminNavItems = [
  {
    title: 'Overview',
    href: '/admin',
    icon: BarChart3,
    description: 'Dashboard overview'
  },
  {
    title: 'Applications',
    href: '/admin/applications',
    icon: FileText,
    description: 'Manage applications'
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: TrendingUp,
    description: 'Performance analytics'
  },
  {
    title: 'Reports',
    href: '/admin/reports',
    icon: Download,
    description: 'Generate reports'
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
    description: 'User management'
  },
  {
    title: 'Activity',
    href: '/admin/activity',
    icon: Activity,
    description: 'System activity'
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'Admin settings'
  }
]

export default function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const { user, profile, signOut } = useAuth()

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'A'
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 bg-card border-r transition-all duration-300 ease-in-out",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b bg-primary/5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary rounded-lg">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="font-bold text-lg">Admin Panel</h2>
              <p className="text-xs text-muted-foreground">The Unfair Advantage</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || 
                           (pathname.startsWith(item.href) && item.href !== '/admin')

            return (
              <div key={item.href} className="relative group">
                <Link href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full transition-all duration-200",
                      isCollapsed ? "px-2 justify-center" : "justify-start",
                      isActive && "bg-primary/10 text-primary border-primary/20"
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <div className="ml-3 flex-1 text-left">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.description}
                        </div>
                      </div>
                    )}
                    
                    {/* Show notification badges */}
                    {item.href === '/admin/applications' && !isCollapsed && (
                      <Badge variant="destructive" className="ml-auto">
                        3
                      </Badge>
                    )}
                  </Button>
                </Link>
                
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-md border shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.description}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* User Profile */}
      <div className="border-t p-4">
        {!isCollapsed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.avatar_url} alt={profile?.name} />
                <AvatarFallback className="text-sm font-medium">
                  {getInitials(profile?.name || '')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{profile?.name}</p>
                <Badge variant="secondary" className="text-xs">
                  Admin
                </Badge>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url} alt={profile?.name} />
              <AvatarFallback className="text-sm font-medium">
                {getInitials(profile?.name || '')}
              </AvatarFallback>
            </Avatar>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-0 h-8 w-8"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
