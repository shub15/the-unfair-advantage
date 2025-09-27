'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  Filter, 
  Calendar, 
  Eye, 
  Download,
  History,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface EvaluationHistory {
  id: string
  title: string
  industry: string
  overallScore: number
  status: 'completed' | 'pending' | 'failed'
  submittedAt: Date
  completedAt?: Date
}

export default function HistoryPage() {
  const [evaluations, setEvaluations] = useState<EvaluationHistory[]>([])
  const [filteredEvaluations, setFilteredEvaluations] = useState<EvaluationHistory[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [industryFilter, setIndustryFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockData: EvaluationHistory[] = [
      {
        id: '1',
        title: 'AI-Powered Learning Platform',
        industry: 'Education',
        overallScore: 85,
        status: 'completed',
        submittedAt: new Date('2025-01-15'),
        completedAt: new Date('2025-01-16')
      },
      {
        id: '2',
        title: 'Sustainable Food Delivery',
        industry: 'Food & Beverages',
        overallScore: 72,
        status: 'completed',
        submittedAt: new Date('2025-01-10'),
        completedAt: new Date('2025-01-11')
      },
      {
        id: '3',
        title: 'Smart Irrigation System',
        industry: 'Agriculture',
        overallScore: 0,
        status: 'pending',
        submittedAt: new Date('2025-01-20')
      },
      {
        id: '4',
        title: 'Digital Health Records',
        industry: 'Healthcare',
        overallScore: 91,
        status: 'completed',
        submittedAt: new Date('2025-01-05'),
        completedAt: new Date('2025-01-06')
      },
      {
        id: '5',
        title: 'Blockchain Voting System',
        industry: 'Technology',
        overallScore: 0,
        status: 'failed',
        submittedAt: new Date('2025-01-12')
      }
    ]

    setTimeout(() => {
      setEvaluations(mockData)
      setFilteredEvaluations(mockData)
      setIsLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    let filtered = evaluations

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(eval => 
        eval.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eval.industry.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(eval => eval.status === statusFilter)
    }

    // Industry filter
    if (industryFilter !== 'all') {
      filtered = filtered.filter(eval => eval.industry === industryFilter)
    }

    setFilteredEvaluations(filtered)
  }, [searchQuery, statusFilter, industryFilter, evaluations])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getScoreColor = (score: number) => {
    if (score === 0) return 'text-muted-foreground'
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const uniqueIndustries = Array.from(new Set(evaluations.map(e => e.industry)))

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-2">
        <History className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Evaluation History</h1>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title or industry..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {uniqueIndustries.map(industry => (
                  <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredEvaluations.length} {filteredEvaluations.length === 1 ? 'Evaluation' : 'Evaluations'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : filteredEvaluations.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No evaluations found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or submit a new idea for evaluation.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvaluations.map((evaluation) => (
                <div 
                  key={evaluation.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{evaluation.title}</h3>
                      <Badge variant="secondary">{evaluation.industry}</Badge>
                      <Badge className={getStatusColor(evaluation.status)}>
                        {evaluation.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Submitted {format(evaluation.submittedAt, 'MMM d, yyyy')}
                      </div>
                      {evaluation.completedAt && (
                        <div>
                          Completed {format(evaluation.completedAt, 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {evaluation.status === 'completed' && (
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(evaluation.overallScore)}`}>
                          {evaluation.overallScore}
                          <span className="text-sm text-muted-foreground">/100</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          {evaluation.overallScore >= 75 ? (
                            <TrendingUp className="h-3 w-3 text-green-600" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-600" />
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      {evaluation.status === 'completed' && (
                        <>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/results/${evaluation.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      
                      {evaluation.status === 'pending' && (
                        <Badge variant="outline" className="text-xs">
                          Processing...
                        </Badge>
                      )}
                      
                      {evaluation.status === 'failed' && (
                        <Button variant="outline" size="sm">
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
