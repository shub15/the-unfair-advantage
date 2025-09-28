'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {  
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  RefreshCw
} from 'lucide-react'
import AdminRoute from '@/components/auth/admin-route'
import { 
  adminDatabaseService, 
  AdminEvaluationOverview 
} from '@/lib/admin-database-service'
import LoadingSpinner from '@/components/common/loading-spinner'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
    under_review: { color: 'bg-blue-100 text-blue-800', icon: Eye }
  }
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
  const Icon = config.icon
  
  return (
    <Badge className={config.color}>
      <Icon className="h-3 w-3 mr-1" />
      {status.replace('_', ' ')}
    </Badge>
  )
}

// Priority badge component
const PriorityBadge = ({ priority }: { priority: string }) => {
  const priorityConfig = {
    low: 'bg-gray-100 text-gray-800',
    normal: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  }
  
  return (
    <Badge className={priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.normal}>
      {priority}
    </Badge>
  )
}

export default function AdminApplications() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [applications, setApplications] = useState<AdminEvaluationOverview[]>([])
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  
  // Filters and pagination
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    admin_status: searchParams.get('admin_status') || '',
    industry: searchParams.get('industry') || '',
    priority_level: searchParams.get('priority') || '',
    cohort: searchParams.get('cohort') || ''
  })
  
  const [pagination, setPagination] = useState({
    page: Number(searchParams.get('page')) || 1,
    limit: 20,
    sort_by: searchParams.get('sort') || 'submitted_at',
    sort_order: (searchParams.get('order') as 'asc' | 'desc') || 'desc'
  })

  const [filterOptions, setFilterOptions] = useState<any>({})

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    if (!user?.id) return
    
    setIsLoading(true)
    try {
      const { data, count } = await adminDatabaseService.getAdminEvaluations(
        user.id,
        filters,
        pagination
      )
      setApplications(data)
      setTotalCount(count)
    } catch (error: any) {
      console.error('Error fetching applications:', error)
      toast.error('Failed to load applications')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, filters, pagination])

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const options = await adminDatabaseService.getFilterOptions(user.id)
      setFilterOptions(options)
    } catch (error) {
      console.error('Error fetching filter options:', error)
    }
  }, [user?.id])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  useEffect(() => {
    fetchFilterOptions()
  }, [fetchFilterOptions])

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }

  // Handle bulk actions
  const handleBulkAction = async (action: string, status?: string) => {
    if (selectedApplications.size === 0) {
      toast.error('Please select applications first')
      return
    }

    try {
      const applicationIds = Array.from(selectedApplications)
      
      if (action === 'update_status' && status) {
        await adminDatabaseService.bulkUpdateEvaluations(
          user!.id, 
          applicationIds, 
          { admin_status: status as any }
        )
        toast.success(`Updated ${applicationIds.length} applications to ${status}`)
      }
      
      setSelectedApplications(new Set())
      fetchApplications()
    } catch (error: any) {
      toast.error(`Bulk action failed: ${error.message}`)
    }
  }

  // Handle individual application status update
  const handleStatusUpdate = async (applicationId: string, status: string) => {
    try {
      await adminDatabaseService.updateEvaluationStatus(
        user!.id,
        applicationId,
        { admin_status: status as any }
      )
      toast.success(`Application ${status}`)
      fetchApplications()
    } catch (error: any) {
      toast.error(`Failed to update status: ${error.message}`)
    }
  }

  // Handle selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedApplications(new Set(applications.map(app => app.id)))
    } else {
      setSelectedApplications(new Set())
    }
  }

  const handleSelectApplication = (applicationId: string, checked: boolean) => {
    const newSelection = new Set(selectedApplications)
    if (checked) {
      newSelection.add(applicationId)
    } else {
      newSelection.delete(applicationId)
    }
    setSelectedApplications(newSelection)
  }

  const totalPages = Math.ceil(totalCount / pagination.limit)

  return (
    <AdminRoute>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Application Management</h1>
            <p className="text-muted-foreground">
              Review and manage business idea submissions
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchApplications}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="lg:col-span-2">
                <Input
                  placeholder="Search applications..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full"
                />
              </div>
              
              <Select value={filters.admin_status} onValueChange={(value) => handleFilterChange('admin_status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Admin Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.industry} onValueChange={(value) => handleFilterChange('industry', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Industries</SelectItem>
                  {filterOptions.industries?.map((industry: string) => (
                    <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.priority_level} onValueChange={(value) => handleFilterChange('priority_level', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.cohort} onValueChange={(value) => handleFilterChange('cohort', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Cohort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Cohorts</SelectItem>
                  {filterOptions.cohorts?.map((cohort: string) => (
                    <SelectItem key={cohort} value={cohort}>{cohort}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedApplications.size > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  {selectedApplications.size} application(s) selected
                </span>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBulkAction('update_status', 'approved')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Selected
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBulkAction('update_status', 'rejected')}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Selected
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Applications ({totalCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner text="Loading applications..." />
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Applications Found</h3>
                <p className="text-muted-foreground">
                  No applications match your current filters.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedApplications.size === applications.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Application</TableHead>
                      <TableHead>Entrepreneur</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedApplications.has(application.id)}
                            onCheckedChange={(checked) => 
                              handleSelectApplication(application.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{application.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {application.industry}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{application.student_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {application.student_email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={application.admin_status} />
                        </TableCell>
                        <TableCell>
                          <PriorityBadge priority={application.priority_level} />
                        </TableCell>
                        <TableCell>
                          {application.overall_score ? (
                            <Badge variant="secondary">
                              {application.overall_score}/100
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDistanceToNow(new Date(application.submitted_at), { addSuffix: true })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/applications/${application.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/applications/${application.id}/edit`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(application.id, 'approved')}
                                className="text-green-600"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(application.id, 'rejected')}
                                className="text-red-600"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, totalCount)} of{' '}
                    {totalCount} applications
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= totalPages}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminRoute>
  )
}
