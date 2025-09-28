'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react'
import AdminRoute from '@/components/auth/admin-route'
import { 
  adminDatabaseService, 
  PerformanceMetrics,
  CohortAnalysis
} from '@/lib/admin-database-service'
import LoadingSpinner from '@/components/common/loading-spinner'
import { toast } from 'sonner'

// Simple chart component (you can replace with a proper charting library)
const SimpleBarChart = ({ 
  data, 
  title,
  xKey,
  yKey,
  height = 200
}: {
  data: any[]
  title: string
  xKey: string
  yKey: string
  height?: number
}) => {
  if (!data || data.length === 0) return null

  const maxValue = Math.max(...data.map(item => item[yKey]))
  
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm">{title}</h4>
      <div className="flex items-end gap-1" style={{ height: `${height}px` }}>
        {data.slice(-12).map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div
              className="bg-primary rounded-t w-full transition-all duration-300 hover:bg-primary/80"
              style={{ 
                height: `${(item[yKey] / maxValue) * (height - 40)}px`,
                minHeight: '4px'
              }}
              title={`${item[xKey]}: ${item[yKey]}`}
            />
            <div className="text-xs text-muted-foreground mt-1 rotate-45 origin-left">
              {new Date(item[xKey]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminAnalytics() {
  const { user } = useAuth()
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics[]>([])
  const [cohortAnalysis, setCohortAnalysis] = useState<CohortAnalysis[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('6months')

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user?.id) return
      
      try {
        setIsLoading(true)
        
        const [metrics, cohorts] = await Promise.all([
          adminDatabaseService.getPerformanceMetrics(user.id),
          adminDatabaseService.getCohortAnalysis(user.id)
        ])
        
        setPerformanceMetrics(metrics)
        setCohortAnalysis(cohorts)
      } catch (error: any) {
        console.error('Error fetching analytics:', error)
        toast.error('Failed to load analytics data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [user?.id])

  if (isLoading) {
    return (
      <AdminRoute>
        <div className="flex h-screen items-center justify-center">
          <LoadingSpinner size="lg" text="Loading analytics..." />
        </div>
      </AdminRoute>
    )
  }

  const latestMetrics = performanceMetrics[0]
  const totalSubmissions = performanceMetrics.reduce((sum, m) => sum + m.total_submissions, 0)
  const totalApproved = performanceMetrics.reduce((sum, m) => sum + m.approved_applications, 0)
  const approvalRate = totalSubmissions > 0 ? (totalApproved / totalSubmissions) * 100 : 0

  return (
    <AdminRoute>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Platform performance and application insights
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">1 Month</SelectItem>
                <SelectItem value="3months">3 Months</SelectItem>
                <SelectItem value="6months">6 Months</SelectItem>
                <SelectItem value="1year">1 Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSubmissions}</div>
              <p className="text-xs text-muted-foreground">
                Last 6 months
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvalRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {totalApproved} approved applications
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performanceMetrics.length > 0 
                  ? (performanceMetrics.reduce((sum, m) => sum + m.avg_score, 0) / performanceMetrics.length).toFixed(1)
                  : 'N/A'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Average evaluation score
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Cohorts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cohortAnalysis.length}</div>
              <p className="text-xs text-muted-foreground">
                Application cohorts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Submissions Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Submissions Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleBarChart
                data={performanceMetrics}
                title="Weekly Submissions"
                xKey="week_start"
                yKey="total_submissions"
                height={250}
              />
            </CardContent>
          </Card>

          {/* Approval Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Approval Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleBarChart
                data={performanceMetrics}
                title="Weekly Approvals"
                xKey="week_start"
                yKey="approved_applications"
                height={250}
              />
            </CardContent>
          </Card>
        </div>

        {/* Cohort Analysis */}
        {cohortAnalysis.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Cohort Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Cohort</th>
                      <th className="text-left p-2">Applications</th>
                      <th className="text-left p-2">Approved</th>
                      <th className="text-left p-2">Rejected</th>
                      <th className="text-left p-2">Pending</th>
                      <th className="text-left p-2">Avg Score</th>
                      <th className="text-left p-2">Industries</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohortAnalysis.map((cohort) => (
                      <tr key={cohort.application_cohort} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <Badge variant="outline">{cohort.application_cohort}</Badge>
                        </td>
                        <td className="p-2 font-medium">{cohort.total_applications}</td>
                        <td className="p-2">
                          <span className="text-green-600 font-medium">{cohort.approved_count}</span>
                        </td>
                        <td className="p-2">
                          <span className="text-red-600 font-medium">{cohort.rejected_count}</span>
                        </td>
                        <td className="p-2">
                          <span className="text-yellow-600 font-medium">{cohort.pending_count}</span>
                        </td>
                        <td className="p-2">
                          {cohort.avg_score ? cohort.avg_score.toFixed(1) : 'N/A'}
                        </td>
                        <td className="p-2">
                          <div className="max-w-32 truncate" title={cohort.industries}>
                            {cohort.industries}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Metrics Table */}
        {performanceMetrics.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Weekly Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Week</th>
                      <th className="text-left p-2">Submissions</th>
                      <th className="text-left p-2">Completed</th>
                      <th className="text-left p-2">Approved</th>
                      <th className="text-left p-2">Rejected</th>
                      <th className="text-left p-2">Avg Score</th>
                      <th className="text-left p-2">Industries</th>
                      <th className="text-left p-2">Entrepreneurs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceMetrics.slice(0, 10).map((metric) => (
                      <tr key={metric.week_start} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          {new Date(metric.week_start).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </td>
                        <td className="p-2 font-medium">{metric.total_submissions}</td>
                        <td className="p-2">{metric.completed_evaluations}</td>
                        <td className="p-2 text-green-600">{metric.approved_applications}</td>
                        <td className="p-2 text-red-600">{metric.rejected_applications}</td>
                        <td className="p-2">{metric.avg_score ? metric.avg_score.toFixed(1) : 'N/A'}</td>
                        <td className="p-2">{metric.unique_industries}</td>
                        <td className="p-2">{metric.unique_entrepreneurs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminRoute>
  )
}
