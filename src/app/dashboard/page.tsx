import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import StatsOverview from '@/components/dashboard/stats-overview'
import RecentEvaluations from '@/components/dashboard/recent-evaluations'
import QuickActions from '@/components/dashboard/quick-actions'
import { BarChart3, TrendingUp, Clock } from 'lucide-react'
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

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your entrepreneurial journey and business idea evaluations
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/evaluate">
              <Clock className="h-4 w-4 mr-2" />
              Quick Evaluate
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <Suspense fallback={<StatsLoading />}>
        <StatsOverview />
      </Suspense>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Evaluations - Takes 2 columns */}
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
          
          {/* Additional Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">💡 Pro Tip</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Submit ideas regularly to track your improvement over time. 
                Each evaluation helps refine your entrepreneurial thinking.
              </p>
              <Button size="sm" variant="ghost" asChild>
                <Link href="/learn">
                  Learn More
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
