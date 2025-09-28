// // import { Suspense } from 'react'
// // import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// // import StatsOverview from '@/components/dashboard/stats-overview'
// // import RecentEvaluations from '@/components/dashboard/recent-evaluations'
// // import QuickActions from '@/components/dashboard/quick-actions'
// // import { TrendingUp, Lightbulb, LayoutDashboard, LightbulbIcon } from 'lucide-react'

// // // Loading components
// // const StatsLoading = () => (
// //   <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
// //     {[...Array(4)].map((_, i) => (
// //       <Card key={i} className="animate-pulse">
// //         <CardHeader>
// //           <div className="h-4 bg-muted rounded w-3/4" />
// //         </CardHeader>
// //         <CardContent>
// //           <div className="h-8 bg-muted rounded w-1/2" />
// //         </CardContent>
// //       </Card>
// //     ))}
// //   </div>
// // )

// // const EvaluationsLoading = () => (
// //   <Card className="animate-pulse">
// //     <CardHeader>
// //       <div className="h-6 bg-muted rounded w-1/3" />
// //     </CardHeader>
// //     <CardContent>
// //       <div className="space-y-4">
// //         {[...Array(3)].map((_, i) => (
// //           <div key={i} className="h-20 bg-muted rounded" />
// //         ))}
// //       </div>
// //     </CardContent>
// //   </Card>
// // )

// // export default function DashboardPage() {
// //   return (
// //     <div className="space-y-6">
// //       {/* Page Header */}
// //       <div className="flex items-center justify-between">
// //         <div>
// //           <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
// //             <LayoutDashboard/>
// //             Dashboard
// //           </h1>
// //           <p className="text-muted-foreground mt-1">
// //             Track your entrepreneurial journey and business idea evaluations
// //           </p>
// //         </div>
// //       </div>

// //       {/* Stats Overview */}
// //       <Suspense fallback={<StatsLoading />}>
// //         <StatsOverview />
// //       </Suspense>

// //       {/* Main Content Grid */}
// //       <div className="grid gap-6 lg:grid-cols-3">
// //         {/* Recent Evaluations - Takes 2 columns */}
// //         <div className="lg:col-span-2">
// //           <Card>
// //             <CardHeader>
// //               <CardTitle className="flex items-center gap-2">
// //                 <TrendingUp className="h-5 w-5" />
// //                 Recent Evaluations
// //               </CardTitle>
// //             </CardHeader>
// //             <CardContent>
// //               <Suspense fallback={<EvaluationsLoading />}>
// //                 <RecentEvaluations />
// //               </Suspense>
// //             </CardContent>
// //           </Card>
// //         </div>

// //         {/* Quick Actions - Takes 1 column */}
// //         <div className="space-y-6">
// //           <QuickActions />
          
// //           {/* Additional Info Card */}
// //           <Card>
// //           <CardHeader>
// //             <CardTitle className="text-base flex items-center gap-2">
// //               <LightbulbIcon/> Pro Tip
// //             </CardTitle>
// //           </CardHeader>

// //             <CardContent>
// //               <p className="text-sm text-muted-foreground mb-3">
// //                 Submit ideas regularly to track your improvement over time. 
// //                 Each evaluation helps refine your entrepreneurial thinking.
// //               </p>
// //             </CardContent>
// //           </Card>
// //         </div>
// //       </div>
// //     </div>
// //   )
// // }


// // 'use client'

// // import { useAuth } from '@/context/auth-context'
// // import LoadingSpinner from '@/components/common/loading-spinner'
// // import EntrepreneurDashboard from './entrepreneur-dashboard'
// // import MentorDashboard from './entrepreneur-dashboard'

// // export default function DashboardPage() {
// //   const { user, isLoading } = useAuth()

// //   if (isLoading) {
// //     return (
// //       <div className="flex h-screen items-center justify-center">
// //         <LoadingSpinner text="Loading Dashboard..." />
// //       </div>
// //     )
// //   }

// //   // This is the logic that chooses the correct dashboard
// //   if (user?.profile?.role === 'mentor') {
// //     return <>
// //     mentor screen
// //       <MentorDashboard />
// //     </>
    
// //   }

// //   // Everyone else sees the entrepreneur dashboard by default
// //   return <>
// //   entre
// //   <EntrepreneurDashboard />
// //   </>
// // }
// 'use client'

// import { useAuth } from '@/context/auth-context'
// import LoadingSpinner from '@/components/common/loading-spinner'
// import EntrepreneurDashboard from './entrepreneur-dashboard'
// import MentorDashboard from './mentor-dashboard'

// export default function DashboardPage() {
//   const { user, isLoading } = useAuth()

//   if (isLoading) {
//     return (
//       <div className="flex h-screen items-center justify-center">
//         <LoadingSpinner text="Loading Dashboard..." />
//       </div>
//     )
//   }

//   // This is the logic that chooses the correct dashboard
//   if (user?.profile?.role === 'mentor') {
//     return <MentorDashboard />
//   }

//   // Everyone else sees the entrepreneur dashboard by default
//   return <EntrepreneurDashboard />
// }


'use client'

import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import LoadingSpinner from '@/components/common/loading-spinner'
import EntrepreneurDashboard from './entrepreneur-dashboard'
import MentorDashboard from './mentor-dashboard'

export default function DashboardPage() {
  const { user, profile, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" text="Loading Dashboard..." />
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  // Show loading if profile hasn't loaded yet
  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" text="Setting up your profile..." />
          <p className="text-sm text-muted-foreground">
            This may take a moment for new accounts
          </p>
        </div>
      </div>
    )
  }

  // Route based on user role
  if (profile.role === 'mentor') {
    return <MentorDashboard />
  }

  // Default to entrepreneur dashboard
  return <EntrepreneurDashboard />
}
