'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Eye, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight,
  FileText,
  Clock
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/context/auth-context'

interface RecentEvaluation {
  id: string
  title: string
  industry: string
  overallScore: number
  status: 'completed' | 'pending' | 'reviewing'
  submittedAt: Date
  completedAt?: Date
  trend: 'up' | 'down' | 'stable'
  highlights: string[]
}

export default function RecentEvaluations() {
  const { user } = useAuth()
  const [evaluations, setEvaluations] = useState<RecentEvaluation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRecentEvaluations = async () => {
      setIsLoading(true)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock data - replace with actual API calls
      const mockEvaluations: RecentEvaluation[] = [
        {
          id: '1',
          title: 'AI-Powered Learning Platform for Rural Students',
          industry: 'Education',
          overallScore: 85,
          status: 'completed',
          submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          trend: 'up',
          highlights: ['Strong market potential', 'Clear execution plan']
        },
        {
          id: '2',
          title: 'Sustainable Food Delivery Service',
          industry: 'Food & Beverages',
          overallScore: 72,
          status: 'completed',
          submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          trend: 'stable',
          highlights: ['Good environmental impact', 'Need better scalability plan']
        },
        {
          id: '3',
          title: 'Smart Irrigation System for Farmers',
          industry: 'Agriculture',
          overallScore: 0,
          status: 'pending',
          submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
          trend: 'stable',
          highlights: []
        },
        {
          id: '4',
          title: 'Digital Health Records Platform',
          industry: 'Healthcare',
          overallScore: 91,
          status: 'completed',
          submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          trend: 'up',
          highlights: ['Excellent technical approach', 'Strong regulatory compliance']
        }
      ]
      
      setEvaluations(mockEvaluations)
      setIsLoading(false)
    }

    if (user) {
      fetchRecentEvaluations()
    }
  }, [user])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'reviewing': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
                <div className="h-8 w-16 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {evaluations.map((evaluation) => (
        <Card key={evaluation.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1 mr-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg leading-tight">
                      {evaluation.title}
                    </h3>
                    
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant="secondary">{evaluation.industry}</Badge>
                      <Badge 
                        className={getStatusColor(evaluation.status)}
                        variant="secondary"
                      >
                        {evaluation.status}
                      </Badge>
                    </div>
                  </div>
                  
                  {evaluation.status === 'completed' && (
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        {evaluation.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                        {evaluation.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
                        <span className={`text-2xl font-bold ${getScoreColor(evaluation.overallScore)}`}>
                          {evaluation.overallScore}
                        </span>
                        <span className="text-muted-foreground text-sm">/100</span>
                      </div>
                      <Progress 
                        value={evaluation.overallScore} 
                        className="w-20 h-1 mt-1"
                      />
                    </div>
                  )}
                  
                  {evaluation.status === 'pending' && (
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      <span className="text-sm">Processing...</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>
                    Submitted {formatDistanceToNow(evaluation.submittedAt, { addSuffix: true })}
                  </span>
                  {evaluation.completedAt && (
                    <>
                      <span className="mx-2">•</span>
                      <span>
                        Completed {formatDistanceToNow(evaluation.completedAt, { addSuffix: true })}
                      </span>
                    </>
                  )}
                </div>
                
                {evaluation.highlights.length > 0 && (
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Key Highlights:</h4>
                    <ul className="text-sm text-muted-foreground space-y-0.5">
                      {evaluation.highlights.slice(0, 2).map((highlight, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-primary mr-1">•</span>
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-2">
                {evaluation.status === 'completed' && (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/results/${evaluation.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                  </Button>
                )}
                
                {evaluation.status === 'pending' && (
                  <Button size="sm" variant="ghost" disabled>
                    <Clock className="h-4 w-4 mr-2" />
                    Processing
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {evaluations.length === 0 && (
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
      )}
      
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
