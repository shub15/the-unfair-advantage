'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Clock, 
  Star, 
  MessageSquare
} from 'lucide-react'
import { databaseService } from '@/lib/database-service'

interface MentorStats {
  totalStudents: number
  totalReviews: number
  averageRating: number
  totalRatings: number
  pendingReviews: number
}

export default function MentorStatsOverview() {
  const { user } = useAuth()
  const [stats, setStats] = useState<MentorStats>({
    totalStudents: 0,
    totalReviews: 0,
    averageRating: 0,
    totalRatings: 0,
    pendingReviews: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        const mentorStats = await databaseService.getMentorStats(user.id)
        setStats(mentorStats)
      } catch (error) {
        console.error('Error fetching mentor stats:', error)
        setError('Failed to load statistics')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [user?.id])

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description,
    badge,
    progress
  }: {
    title: string
    value: string | number
    icon: any
    description?: string
    badge?: { text: string; variant: 'default' | 'destructive' | 'secondary' }
    progress?: number
  }) => (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {badge && <Badge variant={badge.variant}>{badge.text}</Badge>}
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        
        {progress !== undefined && (
          <div className="mt-3">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{progress}% excellence rating</p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (error) {
    return (
      <Card className="col-span-full">
        <CardContent className="p-6 text-center">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2" />
              <div className="h-3 bg-muted rounded w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Active Students"
        value={stats.totalStudents}
        icon={Users}
        description={`${stats.totalStudents} entrepreneurs under guidance`}
      />
      
      <StatCard
        title="Pending Reviews"
        value={stats.pendingReviews}
        icon={Clock}
        description="Awaiting your feedback"
        badge={stats.pendingReviews > 0 ? { text: 'Action Needed', variant: 'destructive' } : undefined}
      />
      
      <StatCard
        title="Average Rating"
        value={stats.averageRating > 0 ? `${stats.averageRating.toFixed(1)}/5.0` : 'No ratings yet'}
        icon={Star}
        description={stats.totalRatings > 0 ? `Based on ${stats.totalRatings} reviews` : 'Complete reviews to get rated'}
        progress={stats.averageRating > 0 ? (stats.averageRating / 5) * 100 : 0}
      />
      
      <StatCard
        title="Total Reviews"
        value={stats.totalReviews}
        icon={MessageSquare}
        description="Completed feedback sessions"
      />
    </div>
  )
}
