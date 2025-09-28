'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Activity, 
  RefreshCw, 
  Filter,
  Eye,
  Edit,
  FileText,
  Users,
  BarChart3
} from 'lucide-react'
import AdminRoute from '@/components/auth/admin-route'
import { adminDatabaseService, AdminAction } from '@/lib/admin-database-service'
import LoadingSpinner from '@/components/common/loading-spinner'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

const getActionIcon = (actionType: string) => {
  const icons = {
    evaluation_review: Eye,
    status_change: Edit,
    note_added: FileText,
    report_generated: BarChart3,
    bulk_action: Users
  }
  return icons[actionType as keyof typeof icons] || Activity
}

const getActionColor = (actionType: string) => {
  const colors = {
    evaluation_review: 'bg-blue-100 text-blue-800',
    status_change: 'bg-green-100 text-green-800',
    note_added: 'bg-yellow-100 text-yellow-800',
    report_generated: 'bg-purple-100 text-purple-800',
    bulk_action: 'bg-red-100 text-red-800'
  }
  return colors[actionType as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

export default function AdminActivity() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<AdminAction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    admin_id: '',
    action_type: '',
    days: 7
  })

  useEffect(() => {
    const fetchActivity = async () => {
      if (!user?.id) return
      
      try {
        setIsLoading(true)
        const activityData = await adminDatabaseService.getAdminActivity(user.id, filters)
        setActivities(activityData)
      } catch (error: any) {
        console.error('Error fetching activity:', error)
        toast.error('Failed to load activity log')
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivity()
  }, [user?.id, filters])

  const handleRefresh = () => {
    setFilters({ ...filters }) // Trigger useEffect
  }

  return (
    <AdminRoute>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Activity Log</h1>
            <p className="text-muted-foreground">
              Track all administrative actions and system events
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select 
                value={filters.action_type} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, action_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Actions</SelectItem>
                  <SelectItem value="evaluation_review">Evaluation Review</SelectItem>
                  <SelectItem value="status_change">Status Change</SelectItem>
                  <SelectItem value="note_added">Note Added</SelectItem>
                  <SelectItem value="report_generated">Report Generated</SelectItem>
                  <SelectItem value="bulk_action">Bulk Action</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={filters.days.toString()} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, days: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 24 hours</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline ({activities.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner text="Loading activity..." />
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Activity Found</h3>
                <p className="text-muted-foreground">
                  No administrative actions match your current filters.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => {
                  const ActionIcon = getActionIcon(activity.action_type)
                  
                  return (
                    <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-shrink-0">
                        <div className="p-2 rounded-full bg-primary/10">
                          <ActionIcon className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getActionColor(activity.action_type)}>
                            {activity.action_type.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {activity.user_profiles?.name?.charAt(0) || 'A'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">
                            {activity.user_profiles?.name || 'Admin'}
                          </span>
                        </div>
                        
                        {activity.action_details && (
                          <div className="text-sm text-muted-foreground">
                            {activity.action_type === 'evaluation_review' && (
                              <span>Reviewed application and updated status</span>
                            )}
                            {activity.action_type === 'bulk_action' && activity.action_details.count && (
                              <span>Performed bulk action on {activity.action_details.count} applications</span>
                            )}
                            {activity.action_type === 'report_generated' && activity.action_details.report_type && (
                              <span>Generated {activity.action_details.report_type} with {activity.action_details.record_count} records</span>
                            )}
                          </div>
                        )}
                        
                        {activity.target_type && activity.target_id && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Target: {activity.target_type} ({activity.target_id.slice(0, 8)}...)
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminRoute>
  )
}
