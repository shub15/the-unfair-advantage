'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  MessageSquare, 
  Star, 
  CheckCircle, 
  Clock, 
  User,
  Award,
  TrendingUp
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ActivityItem {
  id: string
  type: 'review_completed' | 'feedback_given' | 'rating_received' | 'session_conducted' | 'message_sent'
  description: string
  studentName?: string
  studentAvatar?: string
  timestamp: Date
  metadata?: {
    rating?: number
    ideaTitle?: string
    sessionDuration?: number
  }
}

export default function RecentMentorActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Mock data
    const mockActivities: ActivityItem[] = [
      {
        id: '1',
        type: 'review_completed',
        description: 'Completed evaluation review',
        studentName: 'Rahul Sharma',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        metadata: { ideaTitle: 'AI-Powered Crop Disease Detection' }
      },
      {
        id: '2',
        type: 'rating_received',
        description: 'Received 5-star rating',
        studentName: 'Priya Patel',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        metadata: { rating: 5, ideaTitle: 'Sustainable Food Delivery' }
      },
      {
        id: '3',
        type: 'session_conducted',
        description: 'Conducted mentoring session',
        studentName: 'Amit Kumar',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        metadata: { sessionDuration: 45 }
      },
      {
        id: '4',
        type: 'feedback_given',
        description: 'Provided detailed feedback',
        studentName: 'Sneha Gupta',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        metadata: { ideaTitle: 'EdTech Platform for Rural Students' }
      },
      {
        id: '5',
        type: 'message_sent',
        description: 'Sent guidance message',
        studentName: 'Karan Singh',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      }
    ]

    setTimeout(() => {
      setActivities(mockActivities)
      setIsLoading(false)
    }, 1000)
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'review_completed': return CheckCircle
      case 'feedback_given': return MessageSquare
      case 'rating_received': return Star
      case 'session_conducted': return Award
      case 'message_sent': return MessageSquare
      default: return User
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'review_completed': return 'text-green-600 bg-green-50'
      case 'feedback_given': return 'text-blue-600 bg-blue-50'
      case 'rating_received': return 'text-yellow-600 bg-yellow-50'
      case 'session_conducted': return 'text-purple-600 bg-purple-50'
      case 'message_sent': return 'text-indigo-600 bg-indigo-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center gap-3">
            <div className="h-10 w-10 bg-muted rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.length === 0 ? (
        <div className="text-center py-8">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No recent activity</h3>
          <p className="text-muted-foreground">
            Your recent mentoring activities will appear here.
          </p>
        </div>
      ) : (
        activities.map((activity) => {
          const ActivityIcon = getActivityIcon(activity.type)
          const colorClasses = getActivityColor(activity.type)
          
          return (
            <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
              <div className={`p-2 rounded-full ${colorClasses}`}>
                <ActivityIcon className="h-4 w-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium">{activity.description}</p>
                  {activity.metadata?.rating && (
                    <div className="flex items-center gap-1">
                      {[...Array(activity.metadata.rating)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 text-yellow-500 fill-current" />
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {activity.studentName && (
                    <>
                      <div className="flex items-center gap-1">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={activity.studentAvatar} alt={activity.studentName} />
                          <AvatarFallback className="text-xs">
                            {getInitials(activity.studentName)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{activity.studentName}</span>
                      </div>
                      <span>•</span>
                    </>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </div>
                  
                  {activity.metadata?.ideaTitle && (
                    <>
                      <span>•</span>
                      <span className="truncate max-w-32">{activity.metadata.ideaTitle}</span>
                    </>
                  )}
                  
                  {activity.metadata?.sessionDuration && (
                    <>
                      <span>•</span>
                      <span>{activity.metadata.sessionDuration} min session</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })
      )}
      
      <div className="text-center pt-4">
        <Button variant="ghost" size="sm">
          View All Activity
        </Button>
      </div>
    </div>
  )
}
