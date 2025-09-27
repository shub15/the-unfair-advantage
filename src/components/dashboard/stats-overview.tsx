'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  FileText, 
  Award,
  Clock,
  BarChart3
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'

interface DashboardStats {
  totalIdeas: number
  averageScore: number
  completedEvaluations: number
  pendingReviews: number
  topCategory: string
  improvementRate: number
  thisWeek: {
    ideas: number
    change: number
  }
  thisMonth: {
    evaluations: number
    change: number
  }
}

export default function StatsOverview() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalIdeas: 0,
    averageScore: 0,
    completedEvaluations: 0,
    pendingReviews: 0,
    topCategory: 'Technology',
    improvementRate: 0,
    thisWeek: { ideas: 0, change: 0 },
    thisMonth: { evaluations: 0, change: 0 }
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching user stats
    const fetchStats = async () => {
      setIsLoading(true)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock data - replace with actual API calls
      setStats({
        totalIdeas: 12,
        averageScore: 78,
        completedEvaluations: 10,
        pendingReviews: 2,
        topCategory: 'Technology',
        improvementRate: 85,
        thisWeek: { ideas: 3, change: 50 },
        thisMonth: { evaluations: 8, change: 25 }
      })
      
      setIsLoading(false)
    }

    if (user) {
      fetchStats()
    }
  }, [user])

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    description,
    progress 
  }: {
    title: string
    value: string | number
    change?: number
    icon: any
    description?: string
    progress?: number
  }) => (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        
        {change !== undefined && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {change >= 0 ? (
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
            )}
            <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
              {Math.abs(change)}%
            </span>
            <span className="ml-1">from last period</span>
          </div>
        )}
        
        {description && !change && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        
        {progress !== undefined && (
          <div className="mt-3">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{progress}% target achieved</p>
          </div>
        )}
      </CardContent>
    </Card>
  )

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
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Ideas Submitted"
          value={stats.totalIdeas}
          change={stats.thisWeek.change}
          icon={FileText}
        />
        
        <StatCard
          title="Average Score"
          value={`${stats.averageScore}/100`}
          icon={Target}
          description="Your evaluation average"
          progress={stats.averageScore}
        />
        
        <StatCard
          title="Completed Evaluations"
          value={stats.completedEvaluations}
          change={stats.thisMonth.change}
          icon={Award}
        />
        
        <StatCard
          title="Pending Reviews"
          value={stats.pendingReviews}
          icon={Clock}
          description="Awaiting mentor feedback"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Improvement Rate</span>
                <span className="text-sm text-muted-foreground">{stats.improvementRate}%</span>
              </div>
              <Progress value={stats.improvementRate} className="h-2" />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Ideas This Week</span>
                <span className="text-sm text-muted-foreground">{stats.thisWeek.ideas}</span>
              </div>
              <Progress value={(stats.thisWeek.ideas / 5) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Category Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Top Category</span>
                  <span className="text-sm text-primary font-medium">{stats.topCategory}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Most of your ideas fall into this category
                </p>
              </div>
              
              <div className="pt-2">
                <p className="text-xs text-muted-foreground">
                  Consider exploring other industries to diversify your portfolio
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
