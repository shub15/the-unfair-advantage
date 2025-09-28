// 'use client'

// import { useState } from 'react'
// import Link from 'next/link'
// import { usePathname } from 'next/navigation'
// import { Button } from '@/components/ui/button'
// import { ScrollArea } from '@/components/ui/scroll-area'
// import { cn } from '@/lib/utils'
// import { 
//   BarChart3, 
//   FileText, 
//   History, 
//   TrendingUp, 
//   Users, 
//   Settings,
//   Lightbulb,
//   PlusCircle,
//   LayoutDashboard
// } from 'lucide-react'

// const navigationItems = [
//   {
//     title: 'Overview',
//     href: '/dashboard',
//     icon: BarChart3
//   },
//   {
//     title: 'Evaluations',
//     href: '/dashboard/evaluations',
//     icon: FileText
//   },
//   {
//     title: 'History',
//     href: '/dashboard/history',
//     icon: History
//   },
//   {
//     title: 'Analytics',
//     href: '/dashboard/analytics',
//     icon: TrendingUp
//   },
//   {
//     title: 'Mentors',
//     href: '/mentors',
//     icon: Users
//   },
//   {
//     title: 'Settings',
//     href: '/settings',
//     icon: Settings
//   }
// ]

// interface SidebarProps {
//   className?: string
// }

// export default function Sidebar({ className }: SidebarProps) {
//   const [isHovered, setIsHovered] = useState(false)
//   const [isPinned, setIsPinned] = useState(false)
//   const pathname = usePathname()

//   const isExpanded = isPinned || isHovered

//   return (
//     <>
//       {/* Fixed Sidebar */}
//       <div 
//         className={cn(
//           "fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r transition-all duration-300 ease-in-out",
//           isExpanded ? "w-64" : "w-16",
//           className
//         )}
//         onMouseEnter={() => setIsHovered(true)}
//         onMouseLeave={() => setIsHovered(false)}
//       >
//         {/* Header */}
//         <div className="p-4 border-b">
//           <div className="flex items-center gap-2">
//             <LayoutDashboard/>
//             <div className={cn(
//               "transition-all duration-300 overflow-hidden",
//               isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
//             )}>
//               <h2 className="font-semibold text-lg whitespace-nowrap">Dashboard</h2>
//               <p className="text-xs text-muted-foreground whitespace-nowrap">Track your journey</p>
//             </div>
//           </div>
//         </div>

//         {/* Pin/Unpin Toggle - Only visible when expanded */}
//         <div className={cn(
//           "absolute top-4 right-0 transition-all duration-300",
//           isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
//         )}>
//           <Button
//             variant="ghost"
//             size="sm"
//             className="h-6 w-6 p-0"
//             onClick={() => setIsPinned(!isPinned)}
//           >
//             <div className={cn(
//               "h-2 w-2 rounded-full transition-colors",
//               isPinned ? "bg-primary" : "bg-muted-foreground"
//             )} />
//           </Button>
//         </div>

//         {/* Navigation */}
//         <ScrollArea className="flex-1 px- py-2">
//           <nav className="space-y-1">
//             {navigationItems.map((item) => {
//               const Icon = item.icon
//               const isActive = pathname === item.href

//               return (
//                 <div key={item.href} className="relative group">
//                   <Link href={item.href}>
//                     <Button
//                       variant={isActive ? "secondary" : "ghost"}
//                       className={cn(
//                         "w-full transition-all duration-300",
//                         isExpanded 
//                           ? "justify-start gap-2 h-10" 
//                           : "justify-center h-10 px-0",
//                         isActive && "bg-primary/10 text-primary hover:bg-primary/20"
//                       )}
//                     >
//                       <Icon className="h-4 w-4 shrink-0" />
//                       <span className={cn(
//                         "transition-all duration-300 overflow-hidden whitespace-nowrap",
//                         isExpanded ? "opacity-100 w-auto ml-2" : "opacity-0 w-0"
//                       )}>
//                         {item.title}
//                       </span>
//                     </Button>
//                   </Link>
                  
//                   {/* Tooltip for collapsed state */}
//                   {!isExpanded && (
//                     <div className={cn(
//                       "absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1",
//                       "bg-popover text-popover-foreground text-sm rounded-md border shadow-md",
//                       "opacity-0 pointer-events-none transition-opacity duration-200",
//                       "group-hover:opacity-100 z-50 whitespace-nowrap"
//                     )}>
//                       {item.title}
//                     </div>
//                   )}
//                 </div>
//               )
//             })}
//           </nav>
//         </ScrollArea>

//         {/* Footer */}
//         <div className="p-4 border-t">
//           <div className={cn(
//             "text-xs text-muted-foreground text-center transition-all duration-300",
//             isExpanded ? "opacity-100" : "opacity-0"
//           )}>
//             <p className="whitespace-nowrap">The Unfair Advantage</p>
//             <p className="mt-1 whitespace-nowrap">v1.0.0</p>
//           </div>
//         </div>
//       </div>

//       {/* Spacer to push content to the right */}
//       <div className={cn(
//         "transition-all duration-300",
//         isExpanded ? "w-64" : "w-16"
//       )} />
//     </>
//   )
// }

'use client'

import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import HoverSidebar from '@/components/layout/hover-sidebar'
import LoadingSpinner from '@/components/common/loading-spinner'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Fixed Sidebar */}
      <HoverSidebar />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}
