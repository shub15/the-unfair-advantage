'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  Target, 
  FileText, 
  Award, 
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { databaseService } from '@/lib/database-service'

interface UserStats {
  totalIdeas: number
  completedEvaluations: number
  pendingEvaluations: number
  reviewingEvaluations: number
  averageScore: number
  thisMonthIdeas: number
}

export default function StatsOverview() {
  const { user } = useAuth()
  const [stats, setStats] = useState<UserStats>({
    totalIdeas: 0,
    completedEvaluations: 0,
    pendingEvaluations: 0,
    reviewingEvaluations: 0,
    averageScore: 0,
    thisMonthIdeas: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        const userStats = await databaseService.getUserEvaluationStats(user.id)
        setStats(userStats)
      } catch (error) {
        console.error('Error fetching stats:', error)
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
    progress,
    trend
  }: {
    title: string
    value: string | number
    icon: any
    description?: string
    progress?: number
    trend?: number
  }) => (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        
        {trend !== undefined && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {trend >= 0 ? (
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
            )}
            <span className={trend >= 0 ? 'text-green-600' : 'text-red-600'}>
              {trend >= 0 ? '+' : ''}{trend} this month
            </span>
          </div>
        )}
        
        {description && !trend && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        
        {progress !== undefined && (
          <div className="mt-3">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {progress}% of target achieved
            </p>
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
        title="Total Ideas Submitted"
        value={stats.totalIdeas}
        trend={stats.thisMonthIdeas}
        icon={FileText}
      />
      
      <StatCard
        title="Average Score"
        value={stats.averageScore > 0 ? `${stats.averageScore}/100` : 'N/A'}
        icon={Target}
        description={stats.completedEvaluations > 0 ? `Based on ${stats.completedEvaluations} evaluations` : 'Complete an evaluation to see score'}
        progress={stats.averageScore}
      />
      
      <StatCard
        title="Completed Evaluations"
        value={stats.completedEvaluations}
        icon={Award}
        description={`${stats.totalIdeas - stats.completedEvaluations} in progress`}
      />
      
      <StatCard
        title="Pending Reviews"
        value={stats.pendingEvaluations + stats.reviewingEvaluations}
        icon={Clock}
        description={stats.reviewingEvaluations > 0 ? `${stats.reviewingEvaluations} being reviewed` : 'Awaiting processing'}
      />
    </div>
  )
}
