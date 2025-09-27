'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  DollarSign, 
  Zap, 
  Rocket,
  Info
} from 'lucide-react'

interface ScoreVisualizationProps {
  scores?: {
    marketViability: number
    financialFeasibility: number
    executionReadiness: number
    innovationIndex: number
    scalabilityPotential: number
  }
}

export default function ScoreVisualization({ scores }: ScoreVisualizationProps) {
  // Mock data if no scores provided
  const mockScores = {
    marketViability: 88,
    financialFeasibility: 75,
    executionReadiness: 82,
    innovationIndex: 91,
    scalabilityPotential: 79
  }

  const data = scores || mockScores

  const dimensions = [
    {
      key: 'marketViability',
      title: 'Market Viability',
      description: 'Market demand and competition analysis',
      icon: Target,
      score: data.marketViability,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      key: 'financialFeasibility',
      title: 'Financial Feasibility',
      description: 'Revenue models and profitability',
      icon: DollarSign,
      score: data.financialFeasibility,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      key: 'executionReadiness',
      title: 'Execution Readiness',
      description: 'Resources and implementation capability',
      icon: Zap,
      score: data.executionReadiness,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      key: 'innovationIndex',
      title: 'Innovation Index',
      description: 'Uniqueness and differentiation',
      icon: TrendingUp,
      score: data.innovationIndex,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      key: 'scalabilityPotential',
      title: 'Scalability Potential',
      description: 'Growth and expansion opportunities',
      icon: Rocket,
      score: data.scalabilityPotential,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ]

  const getScoreLabel = (score: number) => {
    if (score >= 85) return { label: 'Excellent', variant: 'default' as const }
    if (score >= 70) return { label: 'Good', variant: 'secondary' as const }
    if (score >= 55) return { label: 'Average', variant: 'outline' as const }
    return { label: 'Needs Work', variant: 'destructive' as const }
  }

  const overallScore = Math.round(Object.values(data).reduce((a, b) => a + b, 0) / Object.values(data).length)

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Overall Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-3">
            <div className="text-4xl font-bold text-primary">
              {overallScore}
              <span className="text-lg text-muted-foreground">/100</span>
            </div>
            <Badge {...getScoreLabel(overallScore)}>
              {getScoreLabel(overallScore).label}
            </Badge>
            <Progress value={overallScore} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Detailed Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Dimension Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {dimensions.map((dimension) => {
            const Icon = dimension.icon
            const scoreInfo = getScoreLabel(dimension.score)
            
            return (
              <div key={dimension.key} className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${dimension.bgColor}`}>
                      <Icon className={`h-4 w-4 ${dimension.color}`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{dimension.title}</h4>
                        <Badge variant={scoreInfo.variant} className="text-xs">
                          {scoreInfo.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {dimension.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold mb-1">
                      {dimension.score}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      / 100
                    </div>
                  </div>
                </div>
                
                <Progress value={dimension.score} className="h-2" />
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Strongest Area */}
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-1">🏆 Strongest Area</h4>
              <p className="text-sm text-green-700">
                <strong>
                  {dimensions.reduce((max, dim) => dim.score > max.score ? dim : max).title}
                </strong>
                {' '}({dimensions.reduce((max, dim) => dim.score > max.score ? dim : max).score}/100)
              </p>
            </div>

            {/* Area for Improvement */}
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-800 mb-1">🎯 Focus Area</h4>
              <p className="text-sm text-orange-700">
                <strong>
                  {dimensions.reduce((min, dim) => dim.score < min.score ? dim : min).title}
                </strong>
                {' '}({dimensions.reduce((min, dim) => dim.score < min.score ? dim : min).score}/100) - Consider strengthening this aspect
              </p>
            </div>

            {/* Score Distribution */}
            <div className="pt-2">
              <h4 className="font-medium mb-3">Score Distribution</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Excellent (85+):</span>
                  <span className="font-medium">
                    {dimensions.filter(d => d.score >= 85).length} areas
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Good (70-84):</span>
                  <span className="font-medium">
                    {dimensions.filter(d => d.score >= 70 && d.score < 85).length} areas
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average (55-69):</span>
                  <span className="font-medium">
                    {dimensions.filter(d => d.score >= 55 && d.score < 70).length} areas
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Needs Work (&lt;55):</span>
                  <span className="font-medium">
                    {dimensions.filter(d => d.score < 55).length} areas
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
