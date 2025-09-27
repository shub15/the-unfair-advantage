'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  BarChart3, 
  FileText, 
  History, 
  Settings, 
  TrendingUp, 
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const sidebarItems = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: BarChart3
  },
  {
    title: 'Evaluations',
    href: '/dashboard/evaluations',
    icon: FileText
  },
  {
    title: 'History',
    href: '/dashboard/history',
    icon: History
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: TrendingUp
  },
  {
    title: 'Mentors',
    href: '/dashboard/mentors',
    icon: Users
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings
  }
]

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <aside className={cn(
      "bg-card border-r transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex flex-col h-full">
        {/* Toggle Button */}
        <div className="flex justify-end p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 pb-4">
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User Info */}
        {!isCollapsed && (
          <div className="p-4 border-t">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-primary-foreground">U</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">User Name</p>
                <p className="text-xs text-muted-foreground truncate">Entrepreneur</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
