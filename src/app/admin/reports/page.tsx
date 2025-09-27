'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Download, 
  FileText, 
  Calendar,
  Filter,
  BarChart3,
  Users,
  TrendingUp,
  CheckCircle
} from 'lucide-react'
import AdminRoute from '@/components/auth/admin-route'
import { adminDatabaseService } from '@/lib/admin-database-service'
import LoadingSpinner from '@/components/common/loading-spinner'
import { toast } from 'sonner'
import { format, subDays, subMonths } from 'date-fns'

interface ReportTemplate {
  id: string
  name: string
  description: string
  icon: any
  filters: string[]
}

const reportTemplates: ReportTemplate[] = [
  {
    id: 'applications_summary',
    name: 'Applications Summary',
    description: 'Overview of all applications with status breakdown',
    icon: FileText,
    filters: ['date_range', 'status', 'industry', 'cohort']
  },
  {
    id: 'performance_analytics',
    name: 'Performance Analytics',
    description: 'Detailed performance metrics and trends',
    icon: BarChart3,
    filters: ['date_range', 'cohort']
  },
  {
    id: 'entrepreneur_insights',
    name: 'Entrepreneur Insights',
    description: 'User engagement and demographic analysis',
    icon: Users,
    filters: ['date_range', 'status']
  },
  {
    id: 'approval_analysis',
    name: 'Approval Analysis',
    description: 'Approval rates and decision patterns',
    icon: CheckCircle,
    filters: ['date_range', 'industry', 'cohort']
  }
]

const ReportCard = ({ 
  template, 
  onGenerate, 
  isGenerating 
}: { 
  template: ReportTemplate
  onGenerate: (templateId: string) => void
  isGenerating: boolean
}) => {
  const Icon = template.icon
  
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{template.name}</h3>
            <p className="text-sm text-muted-foreground font-normal">
              {template.description}
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1 mb-4">
          {template.filters.map(filter => (
            <Badge key={filter} variant="secondary" className="text-xs">
              {filter.replace('_', ' ')}
            </Badge>
          ))}
        </div>
        <Button 
          className="w-full"
          onClick={() => onGenerate(template.id)}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

export default function AdminReports() {
  const { user } = useAuth()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingTemplate, setGeneratingTemplate] = useState<string>('')
  const [filterOptions, setFilterOptions] = useState<any>({})
  const [reportFilters, setReportFilters] = useState({
    date_from: format(subMonths(new Date(), 3), 'yyyy-MM-dd'),
    date_to: format(new Date(), 'yyyy-MM-dd'),
    status: '',
    industry: '',
    cohort: '',
    include_details: true,
    format: 'json'
  })

  useEffect(() => {
    const fetchFilterOptions = async () => {
      if (!user?.id) return
      
      try {
        const options = await adminDatabaseService.getFilterOptions(user.id)
        setFilterOptions(options)
      } catch (error) {
        console.error('Error fetching filter options:', error)
      }
    }

    fetchFilterOptions()
  }, [user?.id])

  const generateReport = async (templateId: string) => {
    if (!user?.id) return
    
    try {
      setIsGenerating(true)
      setGeneratingTemplate(templateId)
      
      const template = reportTemplates.find(t => t.id === templateId)
      
      // Generate report based on template
      const reportData = await adminDatabaseService.generateApplicationReport(
        user.id,
        {
          date_from: reportFilters.date_from,
          date_to: reportFilters.date_to,
          status: reportFilters.status,
          cohort: reportFilters.cohort
        }
      )
      
      if (reportData) {
        // Create and download file
        const dataStr = JSON.stringify(reportData, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        
        const link = document.createElement('a')
        link.href = url
        link.download = `${template?.name.toLowerCase().replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        toast.success(`${template?.name} report generated successfully`)
      }
    } catch (error: any) {
      console.error('Error generating report:', error)
      toast.error(`Failed to generate report: ${error.message}`)
    } finally {
      setIsGenerating(false)
      setGeneratingTemplate('')
    }
  }

  const quickDateRanges = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 3 months', days: 90 },
    { label: 'Last 6 months', days: 180 }
  ]

  const setQuickDateRange = (days: number) => {
    const endDate = new Date()
    const startDate = subDays(endDate, days)
    setReportFilters(prev => ({
      ...prev,
      date_from: format(startDate, 'yyyy-MM-dd'),
      date_to: format(endDate, 'yyyy-MM-dd')
    }))
  }

  return (
    <AdminRoute>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground">
              Generate comprehensive reports and export data
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Report Templates */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Report Templates</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {reportTemplates.map((template) => (
                    <ReportCard
                      key={template.id}
                      template={template}
                      onGenerate={generateReport}
                      isGenerating={isGenerating && generatingTemplate === template.id}
                    />
                  ))}
                </div>
              </div>

              {/* Recent Reports */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent reports generated</p>
                    <p className="text-sm mt-1">Generated reports will appear here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Filters Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Report Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date Range */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="date_from" className="text-xs text-muted-foreground">From</Label>
                      <Input
                        id="date_from"
                        type="date"
                        value={reportFilters.date_from}
                        onChange={(e) => setReportFilters(prev => ({ ...prev, date_from: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="date_to" className="text-xs text-muted-foreground">To</Label>
                      <Input
                        id="date_to"
                        type="date"
                        value={reportFilters.date_to}
                        onChange={(e) => setReportFilters(prev => ({ ...prev, date_to: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  {/* Quick Date Range Buttons */}
                  <div className="grid grid-cols-2 gap-1">
                    {quickDateRanges.map((range) => (
                      <Button
                        key={range.days}
                        variant="outline"
                        size="sm"
                        onClick={() => setQuickDateRange(range.days)}
                        className="text-xs"
                      >
                        {range.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <Select 
                    value={reportFilters.status} 
                    onValueChange={(value) => setReportFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Industry Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Industry</Label>
                  <Select 
                    value={reportFilters.industry} 
                    onValueChange={(value) => setReportFilters(prev => ({ ...prev, industry: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All industries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Industries</SelectItem>
                      {filterOptions.industries?.map((industry: string) => (
                        <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Cohort Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Cohort</Label>
                  <Select 
                    value={reportFilters.cohort} 
                    onValueChange={(value) => setReportFilters(prev => ({ ...prev, cohort: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All cohorts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Cohorts</SelectItem>
                      {filterOptions.cohorts?.map((cohort: string) => (
                        <SelectItem key={cohort} value={cohort}>{cohort}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Options */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="include_details"
                        checked={reportFilters.include_details}
                        onCheckedChange={(checked) => 
                          setReportFilters(prev => ({ ...prev, include_details: checked as boolean }))
                        }
                      />
                      <Label htmlFor="include_details" className="text-sm">
                        Include detailed data
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Export Format */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Format</Label>
                  <Select 
                    value={reportFilters.format} 
                    onValueChange={(value) => setReportFilters(prev => ({ ...prev, format: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Period</span>
                  <Badge variant="secondary">
                    {Math.abs(new Date(reportFilters.date_to).getTime() - new Date(reportFilters.date_from).getTime()) / (1000 * 60 * 60 * 24)} days
                  </Badge>
                </div>
                
                <div className="text-center py-4 text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Generate a report to see statistics</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminRoute>
  )
}
