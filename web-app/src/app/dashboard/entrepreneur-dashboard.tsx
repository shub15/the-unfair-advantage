import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import StatsOverview from '@/components/dashboard/stats-overview'
import RecentEvaluations from '@/components/dashboard/recent-evaluations'
import QuickActions from '@/components/dashboard/quick-actions'
import { 
  TrendingUp, 
  LayoutDashboard,
  Clock,
  PlusCircle
} from 'lucide-react'
import Link from 'next/link'

// Loading components
const StatsLoading = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    {[...Array(4)].map((_, i) => (
      <Card key={i} className="animate-pulse">
        <CardHeader>
          <div className="h-4 bg-muted rounded w-3/4" />
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-muted rounded w-1/2" />
        </CardContent>
      </Card>
    ))}
  </div>
)

const EvaluationsLoading = () => (
  <Card className="animate-pulse">
    <CardHeader>
      <div className="h-6 bg-muted rounded w-1/3" />
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-muted rounded" />
        ))}
      </div>
    </CardContent>
  </Card>
)

export default function EntrepreneurDashboard() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <LayoutDashboard className="h-8 w-8 text-primary" />
                Entrepreneur Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Track your entrepreneurial journey and business idea evaluations
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard/history">
                  <Clock className="h-4 w-4 mr-2" />
                  History
                </Link>
              </Button>
              <Button asChild>
                <Link href="/evaluate">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Evaluation
                </Link>
              </Button>
            </div>
          </div>

          {/* Real Stats Overview */}
          <Suspense fallback={<StatsLoading />}>
            <StatsOverview />
          </Suspense>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Real Recent Evaluations - Takes 2 columns */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recent Evaluations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<EvaluationsLoading />}>
                    <RecentEvaluations />
                  </Suspense>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions - Takes 1 column */}
            <div className="space-y-6">
              <QuickActions />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
