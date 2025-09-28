'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Video, Clock, User, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface ScheduleItem {
  id: string
  time: string
  duration: number
  studentName: string
  studentAvatar?: string
  type: 'video-call' | 'review-session' | 'office-hours'
  status: 'upcoming' | 'in-progress' | 'completed'
}

export default function MentorSchedule() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])

  useEffect(() => {
    const today = new Date()
    const mockSchedule: ScheduleItem[] = [
      {
        id: '1',
        time: '10:00 AM',
        duration: 60,
        studentName: 'Rahul Sharma',
        type: 'video-call',
        status: 'upcoming'
      },
      {
        id: '2',
        time: '2:00 PM',
        duration: 30,
        studentName: 'Priya Patel',
        type: 'review-session',
        status: 'upcoming'
      },
      {
        id: '3',
        time: '4:00 PM',
        duration: 45,
        studentName: 'Office Hours',
        type: 'office-hours',
        status: 'upcoming'
      }
    ]

    setSchedule(mockSchedule)
  }, [])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video-call': return Video
      case 'review-session': return Clock
      case 'office-hours': return Calendar
      default: return User
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video-call': return 'bg-blue-100 text-blue-800'
      case 'review-session': return 'bg-purple-100 text-purple-800'
      case 'office-hours': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div className="space-y-4">
      {schedule.length === 0 ? (
        <div className="text-center py-6">
          <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No sessions scheduled for today</p>
        </div>
      ) : (
        schedule.map((item) => {
          const TypeIcon = getTypeIcon(item.type)
          
          return (
            <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-full ${getTypeColor(item.type)}`}>
                  <TypeIcon className="h-3 w-3" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{item.time}</span>
                  <span className="text-xs text-muted-foreground">
                    ({item.duration} min)
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {item.type !== 'office-hours' && (
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={item.studentAvatar} alt={item.studentName} />
                      <AvatarFallback className="text-xs">
                        {getInitials(item.studentName)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <span className="text-sm text-muted-foreground truncate">
                    {item.studentName}
                  </span>
                </div>
              </div>
              
              {item.status === 'upcoming' && (
                <Button variant="outline" size="sm">
                  Join
                </Button>
              )}
            </div>
          )
        })
      )}
      
      <div className="text-center pt-2">
        <Button variant="ghost" size="sm" className="text-xs">
          View Full Calendar
        </Button>
      </div>
    </div>
  )
}
