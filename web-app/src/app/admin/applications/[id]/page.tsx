'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Edit, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  User,
  Calendar,
  BarChart3,
  FileText,
  MessageSquare,
  Star,
  DollarSign,
  TrendingUp
} from 'lucide-react'
import AdminRoute from '@/components/auth/admin-route'
import { adminDatabaseService } from '@/lib/admin-database-service'
import LoadingSpinner from '@/components/common/loading-spinner'
import { toast } from 'sonner'
import { formatDistanceToNow, format } from 'date-fns'
import Link from 'next/link'

const ScoreCard = ({ 
  title, 
  score, 
  maxScore = 100, 
  description 
}: { 
  title: string
  score?: number
  maxScore?: number
  description?: string 
}) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm">{title}</h4>
        <Badge variant={score && score >= 70 ? "default" : score && score >= 50 ? "secondary" : "destructive"}>
          {score ? `${score}/${maxScore}` : 'N/A'}
        </Badge>
      </div>
      {score && (
        <div className="w-full bg-secondary rounded-full h-2 mb-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${(score / maxScore) * 100}%` }}
          />
        </div>
      )}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </CardContent>
  </Card>
)

export default function ApplicationDetail() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [application, setApplication] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    admin_status: '',
    admin_notes: '',
    priority_level: '',
    funding_potential: '',
    commercial_viability: '',
    risk_assessment: '',
    application_cohort: ''
  })

  const applicationId = params.id as string

  useEffect(() => {
    const fetchApplication = async () => {
      if (!user?.id || !applicationId) return
      
      try {
        setIsLoading(true)
        const data = await adminDatabaseService.getEvaluationDetails(user.id, applicationId)
        setApplication(data)
        
        // Initialize form data
        setFormData({
          admin_status: data.admin_status || 'pending',
          admin_notes: data.admin_notes || '',
          priority_level: data.priority_level || 'normal',
          funding_potential: data.funding_potential || '',
          commercial_viability: data.commercial_viability || '',
          risk_assessment: data.risk_assessment || '',
          application_cohort: data.application_cohort || ''
        })
      } catch (error: any) {
        console.error('Error fetching application:', error)
        toast.error('Failed to load application details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchApplication()
  }, [user?.id, applicationId])

  const handleSave = async () => {
    if (!user?.id || !applicationId) return
    
    try {
      setIsSaving(true)
      
      const updates: any = {
        admin_status: formData.admin_status,
        admin_notes: formData.admin_notes,
        priority_level: formData.priority_level,
        risk_assessment: formData.risk_assessment,
        application_cohort: formData.application_cohort
      }
      
      if (formData.funding_potential) {
        updates.funding_potential = parseFloat(formData.funding_potential)
      }
      
      if (formData.commercial_viability) {
        updates.commercial_viability = parseFloat(formData.commercial_viability)
      }

      await adminDatabaseService.updateEvaluationStatus(user.id, applicationId, updates)
      
      setApplication(prev => ({ ...prev, ...updates }))
      setEditMode(false)
      toast.success('Application updated successfully')
    } catch (error: any) {
      console.error('Error updating application:', error)
      toast.error(`Failed to update: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <AdminRoute>
        <div className="flex h-screen items-center justify-center">
          <LoadingSpinner size="lg" text="Loading application details..." />
        </div>
      </AdminRoute>
    )
  }

  if (!application) {
    return (
      <AdminRoute>
        <div className="container mx-auto p-6">
          <Card className="border-destructive">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Application Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The requested application could not be found.
              </p>
              <Button asChild>
                <Link href="/admin/applications">Back to Applications</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminRoute>
    )
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800', 
    rejected: 'bg-red-100 text-red-800',
    under_review: 'bg-blue-100 text-blue-800'
  }

  return (
    <AdminRoute>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{application.title}</h1>
              <p className="text-muted-foreground">{application.industry}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {!editMode ? (
              <Button onClick={() => setEditMode(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Application Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Application Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {application.description}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Target Market</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {application.target_market}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Submitted</Label>
                    <p className="font-medium">{format(new Date(application.submitted_at), 'MMM dd, yyyy')}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Language</Label>
                    <p className="font-medium">{application.language || 'English'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Analysis Scores */}
            {application.overall_score && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    AI Analysis Scores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ScoreCard
                      title="Overall Score"
                      score={application.overall_score}
                      description="Combined evaluation score"
                    />
                    <ScoreCard
                      title="Market Viability"
                      score={application.market_viability}
                      description="Market potential and demand"
                    />
                    <ScoreCard
                      title="Financial Feasibility"
                      score={application.financial_feasibility}
                      description="Economic viability"
                    />
                    <ScoreCard
                      title="Innovation Index"
                      score={application.innovation_index}
                      description="Uniqueness and innovation"
                    />
                    <ScoreCard
                      title="Execution Readiness"
                      score={application.execution_readiness}
                      description="Implementation feasibility"
                    />
                    <ScoreCard
                      title="Scalability"
                      score={application.scalability_potential}
                      description="Growth potential"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mentor Reviews */}
            {application.reviews && application.reviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Mentor Reviews ({application.reviews.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {application.reviews.map((review: any) => (
                    <div key={review.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{review.user_profiles.name}</div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{review.user_profiles.rating || 'N/A'}</span>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {review.overall_rating}/5
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        {review.strengths && review.strengths.length > 0 && (
                          <div>
                            <strong>Strengths:</strong> {review.strengths.join(', ')}
                          </div>
                        )}
                        {review.weaknesses && review.weaknesses.length > 0 && (
                          <div>
                            <strong>Weaknesses:</strong> {review.weaknesses.join(', ')}
                          </div>
                        )}
                        {review.detailed_feedback && (
                          <div>
                            <strong>Feedback:</strong> {review.detailed_feedback}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Student Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  Entrepreneur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <p className="font-medium">{application.user_profiles.name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-medium">{application.user_profiles.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Member Since</Label>
                  <p className="text-sm">
                    {formatDistanceToNow(new Date(application.user_profiles.created_at), { addSuffix: true })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Admin Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Admin Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editMode ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="admin_status">Status</Label>
                      <Select 
                        value={formData.admin_status} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, admin_status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="under_review">Under Review</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="priority_level">Priority</Label>
                      <Select 
                        value={formData.priority_level} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, priority_level: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="risk_assessment">Risk Level</Label>
                      <Select 
                        value={formData.risk_assessment} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, risk_assessment: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select risk level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low Risk</SelectItem>
                          <SelectItem value="medium">Medium Risk</SelectItem>
                          <SelectItem value="high">High Risk</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="application_cohort">Cohort</Label>
                      <input
                        className="w-full p-2 border rounded"
                        value={formData.application_cohort}
                        onChange={(e) => setFormData(prev => ({ ...prev, application_cohort: e.target.value }))}
                        placeholder="e.g., 2025-Q1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="admin_notes">Admin Notes</Label>
                      <Textarea
                        id="admin_notes"
                        value={formData.admin_notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, admin_notes: e.target.value }))}
                        placeholder="Add your review notes..."
                        rows={4}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <div className="mt-1">
                        <Badge className={statusColors[application.admin_status as keyof typeof statusColors]}>
                          {application.admin_status?.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Priority</Label>
                      <p className="capitalize">{application.priority_level || 'Normal'}</p>
                    </div>

                    {application.risk_assessment && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Risk Level</Label>
                        <p className="capitalize">{application.risk_assessment} Risk</p>
                      </div>
                    )}

                    {application.application_cohort && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Cohort</Label>
                        <p>{application.application_cohort}</p>
                      </div>
                    )}

                    {application.admin_notes && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Admin Notes</Label>
                        <p className="text-sm mt-1 p-3 bg-muted rounded">
                          {application.admin_notes}
                        </p>
                      </div>
                    )}

                    {application.admin_decision_date && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Last Updated</Label>
                        <p className="text-sm">
                          {format(new Date(application.admin_decision_date), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            {!editMode && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, admin_status: 'approved' }))
                      setEditMode(true)
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Application
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, admin_status: 'rejected' }))
                      setEditMode(true)
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Application
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Financial Assessment */}
            {(application.funding_potential || application.commercial_viability) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="h-5 w-5" />
                    Financial Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {application.funding_potential && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Funding Potential</Label>
                      <p className="font-medium">{(application.funding_potential * 100).toFixed(0)}%</p>
                    </div>
                  )}
                  {application.commercial_viability && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Commercial Viability</Label>
                      <p className="font-medium">{(application.commercial_viability * 100).toFixed(0)}%</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminRoute>
  )
}
