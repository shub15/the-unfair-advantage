import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import MentorStatsOverview from '@/components/mentor/mentor-stats-overview'
import { 
  Users, 
  Clock, 
  Calendar,
  TrendingUp,
  BookOpen,
  MessageSquare
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

export default function MentorDashboard() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Users className="h-8 w-8 text-primary" />
                Mentor Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Guide entrepreneurs and manage your mentoring activities
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/mentor/schedule">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </Link>
              </Button>
              <Button asChild>
                <Link href="/mentor/reviews">
                  <Clock className="h-4 w-4 mr-2" />
                  Review Queue
                </Link>
              </Button>
            </div>
          </div>

          {/* Real Stats Overview */}
          <Suspense fallback={<StatsLoading />}>
            <MentorStatsOverview />
          </Suspense>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Empty State - To be filled with real mentor content */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No recent activity</h3>
                    <p className="text-muted-foreground mb-4">
                      Start reviewing student submissions to see your activity here
                    </p>
                    <Button asChild>
                      <Link href="/mentor/reviews">
                        View Review Queue
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start gap-2" asChild>
                    <Link href="/mentor/reviews">
                      <Clock className="h-4 w-4" />
                      Review Submissions
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start gap-2" asChild>
                    <Link href="/mentor/students">
                      <Users className="h-4 w-4" />
                      My Students
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start gap-2" asChild>
                    <Link href="/mentor/messages">
                      <MessageSquare className="h-4 w-4" />
                      Messages
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start gap-2" asChild>
                    <Link href="/mentor/schedule">
                      <Calendar className="h-4 w-4" />
                      Schedule
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
