'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Activity,
  Download
} from 'lucide-react'
import AdminRoute from '@/components/auth/admin-route'
import { adminDatabaseService, AdminStats } from '@/lib/admin-database-service'
import LoadingSpinner from '@/components/common/loading-spinner'
import { toast } from 'sonner'
import Link from 'next/link'

// Quick stats cards component
const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  description,
  trend,
  color = 'default'
}: {
  title: string
  value: string | number
  icon: any
  description?: string
  trend?: number
  color?: 'default' | 'success' | 'warning' | 'destructive'
}) => {
  const colorClasses = {
    default: 'text-muted-foreground',
    success: 'text-green-600',
    warning: 'text-yellow-600', 
    destructive: 'text-red-600'
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${colorClasses[color]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {trend !== undefined && (
          <div className="flex items-center mt-1">
            <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
            <span className="text-xs text-green-600">
              +{trend} this week
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return
      
      try {
        setIsLoading(true)
        const adminStats = await adminDatabaseService.getAdminOverview(user.id)
        setStats(adminStats)
      } catch (error: any) {
        console.error('Error fetching admin stats:', error)
        setError(error.message || 'Failed to load dashboard statistics')
        toast.error('Failed to load dashboard data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [user?.id])

  if (isLoading) {
    return (
      <AdminRoute>
        <div className="flex h-screen items-center justify-center">
          <LoadingSpinner size="lg" text="Loading admin dashboard..." />
        </div>
      </AdminRoute>
    )
  }

  if (error) {
    return (
      <AdminRoute>
        <div className="container mx-auto p-6">
          <Card className="border-destructive">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Dashboard Error</h2>
              <p className="text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        </div>
      </AdminRoute>
    )
  }

  return (
    <AdminRoute>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage applications, review evaluations, and analyze platform performance
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/reports">
                <Download className="h-4 w-4 mr-2" />
                Generate Report
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/applications">
                <FileText className="h-4 w-4 mr-2" />
                Review Applications
              </Link>
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Applications"
              value={stats.totalApplications}
              icon={FileText}
              description="All time submissions"
              trend={stats.recentActivity}
            />
            
            <StatCard
              title="Pending Review"
              value={stats.pendingReview}
              icon={Clock}
              color="warning"
              description="Awaiting admin decision"
            />
            
            <StatCard
              title="Approved"
              value={stats.approvedApplications}
              icon={CheckCircle}
              color="success"
              description={`${((stats.approvedApplications / stats.totalApplications) * 100).toFixed(1)}% approval rate`}
            />
            
            <StatCard
              title="Avg Score"
              value={`${stats.averageScore.toFixed(1)}/100`}
              icon={TrendingUp}
              description="Overall evaluation average"
            />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Applications */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Applications Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Approved</span>
                          <span className="text-sm font-medium text-green-600">
                            {stats.approvedApplications}
                          </span>
                        </div>
                        <Progress 
                          value={(stats.approvedApplications / stats.totalApplications) * 100} 
                          className="h-2"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Rejected</span>
                          <span className="text-sm font-medium text-red-600">
                            {stats.rejectedApplications}
                          </span>
                        </div>
                        <Progress 
                          value={(stats.rejectedApplications / stats.totalApplications) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Pending Review</span>
                        <span className="text-sm font-medium text-yellow-600">
                          {stats.pendingReview}
                        </span>
                      </div>
                      <Progress 
                        value={(stats.pendingReview / stats.totalApplications) * 100} 
                        className="h-2"
                      />
                    </div>

                    <div className="pt-4">
                      <Button className="w-full" asChild>
                        <Link href="/admin/applications">
                          View All Applications
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Top Industries */}
            {stats && stats.topIndustries.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Industries</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats.topIndustries.map((industry, index) => (
                    <div key={industry.industry} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{index + 1}</Badge>
                        <span className="text-sm">{industry.industry}</span>
                      </div>
                      <span className="text-sm font-medium">{industry.count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/admin/applications?status=pending">
                    <Clock className="h-4 w-4 mr-2" />
                    Review Pending ({stats?.pendingReview || 0})
                  </Link>
                </Button>
                
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/admin/analytics">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Link>
                </Button>
                
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/admin/users">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </Link>
                </Button>
                
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/admin/reports">
                    <Download className="h-4 w-4 mr-2" />
                    Export Reports
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Health</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Healthy
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Connected
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Processing Queue</span>
                  <Badge variant="secondary">
                    0 pending
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminRoute>
  )
}
