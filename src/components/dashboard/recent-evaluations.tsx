'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Eye, 
  Calendar, 
  Clock,
  FileText,
  ArrowRight
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { databaseService } from '@/lib/database-service'

interface RecentEvaluation {
  id: string
  title: string
  industry: string
  status: string
  overall_score: number | null
  created_at: string
}

export default function RecentEvaluations() {
  const { user } = useAuth()
  const [evaluations, setEvaluations] = useState<RecentEvaluation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvaluations = async () => {
      if (!user?.id) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        const recentEvaluations = await databaseService.getUserRecentEvaluations(user.id, 5)
        setEvaluations(recentEvaluations)
      } catch (error) {
        console.error('Error fetching evaluations:', error)
        setError('Failed to load recent evaluations')
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvaluations()
  }, [user?.id])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'reviewing': return 'bg-blue-100 text-blue-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed'
      case 'pending': return 'Processing'
      case 'reviewing': return 'Under Review'
      case 'failed': return 'Failed'
      default: return status
    }
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
                <div className="h-8 w-16 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (evaluations.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No evaluations yet</h3>
          <p className="text-muted-foreground mb-4">
            Start by submitting your first business idea for evaluation
          </p>
          <Button asChild>
            <Link href="/evaluate">
              Submit Your First Idea
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {evaluations.map((evaluation) => (
        <Card key={evaluation.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium truncate">{evaluation.title}</h4>
                  <Badge variant="secondary">{evaluation.industry}</Badge>
                  <Badge className={getStatusColor(evaluation.status)}>
                    {getStatusText(evaluation.status)}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDistanceToNow(new Date(evaluation.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {evaluation.status === 'completed' && evaluation.overall_score && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {evaluation.overall_score}
                      <span className="text-sm text-muted-foreground">/100</span>
                    </div>
                  </div>
                )}
                
                {evaluation.status === 'pending' && (
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    <span className="text-sm">Processing...</span>
                  </div>
                )}
                
                <div className="flex gap-2">
                  {evaluation.status === 'completed' && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/results/${evaluation.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </Button>
                  )}
                  
                  {evaluation.status !== 'completed' && (
                    <Button variant="ghost" size="sm" disabled>
                      <Clock className="h-4 w-4 mr-2" />
                      {getStatusText(evaluation.status)}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {evaluations.length > 0 && (
        <div className="text-center pt-4">
          <Button variant="outline" asChild>
            <Link href="/dashboard/history">
              View All Evaluations
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
