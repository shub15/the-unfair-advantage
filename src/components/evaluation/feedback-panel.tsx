'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CheckCircle, 
  AlertCircle, 
  Lightbulb, 
  ArrowRight, 
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Star
} from 'lucide-react'

interface FeedbackPanelProps {
  feedback?: {
    strengths: string[]
    weaknesses: string[]
    recommendations: string[]
    nextSteps: string[]
  }
}

export default function FeedbackPanel({ feedback }: FeedbackPanelProps) {
  const [userFeedback, setUserFeedback] = useState<'helpful' | 'not-helpful' | null>(null)
  const [showAllStrengths, setShowAllStrengths] = useState(false)
  const [showAllWeaknesses, setShowAllWeaknesses] = useState(false)

  // Mock data if no feedback provided
  const mockFeedback = {
    strengths: [
      'Strong market demand for educational technology in rural areas',
      'Clear value proposition for underserved student population',
      'Scalable AI-powered personalization technology',
      'Addresses critical social and educational gaps',
      'Potential for significant positive social impact',
      'Growing market trend towards digital education solutions'
    ],
    weaknesses: [
      'High initial technology development costs',
      'Challenges in internet connectivity in rural areas',
      'Need for local language support and content adaptation',
      'Potential difficulty in user acquisition and retention',
      'Regulatory compliance requirements for educational content'
    ],
    recommendations: [
      'Develop partnerships with local educational institutions',
      'Create offline-capable features for areas with poor connectivity',
      'Focus on mobile-first design for wider device accessibility',
      'Implement gradual rollout strategy starting with pilot regions',
      'Build strong content creation and localization team',
      'Establish clear monetization strategy beyond initial funding'
    ],
    nextSteps: [
      'Conduct detailed market research in target regions',
      'Develop minimum viable product (MVP) with core features',
      'Secure seed funding for initial development phase',
      'Build strategic partnerships with educational organizations',
      'Create comprehensive business plan with financial projections',
      'Assemble experienced team with education and technology expertise'
    ]
  }

  const data = feedback || mockFeedback

  const handleUserFeedback = (type: 'helpful' | 'not-helpful') => {
    setUserFeedback(type)
    // Here you would send feedback to your backend
    console.log(`User feedback: ${type}`)
  }

  const FeedbackSection = ({ 
    title, 
    items, 
    icon: Icon, 
    variant,
    showAll,
    setShowAll 
  }: {
    title: string
    items: string[]
    icon: any
    variant: 'success' | 'warning' | 'info' | 'default'
    showAll: boolean
    setShowAll: (show: boolean) => void
  }) => {
    const displayItems = showAll ? items : items.slice(0, 3)
    const hasMore = items.length > 3

    const getVariantStyles = (variant: string) => {
      switch (variant) {
        case 'success':
          return 'border-green-200 bg-green-50'
        case 'warning':
          return 'border-orange-200 bg-orange-50'
        case 'info':
          return 'border-blue-200 bg-blue-50'
        default:
          return 'border-gray-200 bg-gray-50'
      }
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">{title}</h3>
          <Badge variant="outline">{items.length}</Badge>
        </div>
        
        <div className="space-y-2">
          {displayItems.map((item, index) => (
            <div 
              key={index}
              className={`p-3 rounded-lg border ${getVariantStyles(variant)}`}
            >
              <p className="text-sm leading-relaxed">{item}</p>
            </div>
          ))}
        </div>

        {hasMore && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="text-sm"
          >
            {showAll ? 'Show Less' : `Show ${items.length - 3} More`}
            <ArrowRight className={`h-3 w-3 ml-1 transition-transform ${showAll ? 'rotate-90' : ''}`} />
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          AI Analysis & Feedback
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="strengths" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="strengths">Strengths</TabsTrigger>
            <TabsTrigger value="weaknesses">Areas to Improve</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="next-steps">Next Steps</TabsTrigger>
          </TabsList>
          
          <TabsContent value="strengths" className="mt-6">
            <FeedbackSection
              title="Key Strengths"
              items={data.strengths}
              icon={CheckCircle}
              variant="success"
              showAll={showAllStrengths}
              setShowAll={setShowAllStrengths}
            />
          </TabsContent>
          
          <TabsContent value="weaknesses" className="mt-6">
            <FeedbackSection
              title="Areas for Improvement"
              items={data.weaknesses}
              icon={AlertCircle}
              variant="warning"
              showAll={showAllWeaknesses}
              setShowAll={setShowAllWeaknesses}
            />
          </TabsContent>
          
          <TabsContent value="recommendations" className="mt-6">
            <FeedbackSection
              title="Strategic Recommendations"
              items={data.recommendations}
              icon={Lightbulb}
              variant="info"
              showAll={false}
              setShowAll={() => {}}
            />
          </TabsContent>
          
          <TabsContent value="next-steps" className="mt-6">
            <FeedbackSection
              title="Recommended Next Steps"
              items={data.nextSteps}
              icon={ArrowRight}
              variant="default"
              showAll={false}
              setShowAll={() => {}}
            />
          </TabsContent>
        </Tabs>

        {/* User Feedback Section */}
        <div className="mt-8 pt-6 border-t">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium mb-1">Was this feedback helpful?</h4>
              <p className="text-sm text-muted-foreground">
                Your input helps us improve our AI analysis
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={userFeedback === 'helpful' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleUserFeedback('helpful')}
                className="flex items-center gap-1"
              >
                <ThumbsUp className="h-4 w-4" />
                Helpful
              </Button>
              
              <Button
                variant={userFeedback === 'not-helpful' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => handleUserFeedback('not-helpful')}
                className="flex items-center gap-1"
              >
                <ThumbsDown className="h-4 w-4" />
                Not Helpful
              </Button>
            </div>
          </div>

          {userFeedback && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  Thank you for your feedback!
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                We'll use this to make our evaluations even better.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
