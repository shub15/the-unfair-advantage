'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Clock, Eye, MessageSquare, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface PendingReview {
  id: string
  studentName: string
  studentAvatar?: string
  ideaTitle: string
  industry: string
  submittedAt: Date
  priority: 'high' | 'medium' | 'low'
  type: 'evaluation' | 'feedback' | 'question'
}

export default function PendingReviews() {
  const [reviews, setReviews] = useState<PendingReview[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Mock data
    const mockReviews: PendingReview[] = [
      {
        id: '1',
        studentName: 'Rahul Sharma',
        ideaTitle: 'AI-Powered Crop Disease Detection',
        industry: 'Agriculture',
        submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        priority: 'high',
        type: 'evaluation'
      },
      {
        id: '2',
        studentName: 'Priya Patel',
        ideaTitle: 'Sustainable Food Delivery Platform',
        industry: 'Food & Beverages',
        submittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        priority: 'medium',
        type: 'feedback'
      },
      {
        id: '3',
        studentName: 'Amit Kumar',
        ideaTitle: 'Digital Health Records System',
        industry: 'Healthcare',
        submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        priority: 'high',
        type: 'evaluation'
      },
      {
        id: '4',
        studentName: 'Sneha Gupta',
        ideaTitle: 'EdTech Platform for Rural Students',
        industry: 'Education',
        submittedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        priority: 'low',
        type: 'question'
      }
    ]

    setTimeout(() => {
      setReviews(mockReviews)
      setIsLoading(false)
    }, 1000)
  }, [])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'evaluation': return 'bg-blue-100 text-blue-800'
      case 'feedback': return 'bg-purple-100 text-purple-800'
      case 'question': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-muted rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
          <p className="text-muted-foreground">
            No pending reviews at the moment.
          </p>
        </div>
      ) : (
        reviews.map((review) => (
          <Card key={review.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={review.studentAvatar} alt={review.studentName} />
                    <AvatarFallback>
                      {getInitials(review.studentName)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{review.ideaTitle}</h4>
                      <Badge className={getPriorityColor(review.priority)}>
                        {review.priority}
                      </Badge>
                      <Badge className={getTypeColor(review.type)}>
                        {review.type}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {review.studentName}
                      </div>
                      <span>•</span>
                      <span>{review.industry}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(review.submittedAt, { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/mentor/review/${review.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                    </Link>
                  </Button>
                  
                  <Button variant="ghost" size="sm">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
      
      {reviews.length > 0 && (
        <div className="text-center pt-4">
          <Button variant="outline" asChild>
            <Link href="/mentor/review-queue">
              View All Pending Reviews
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
