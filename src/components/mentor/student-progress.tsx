'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  User, 
  MessageSquare, 
  Eye,
  Target,
} from 'lucide-react'
import Link from 'next/link'

interface StudentProgress {
  id: string
  name: string
  avatar?: string
  ideasSubmitted: number
  averageScore: number
  improvement: number
  lastActivity: string
  currentGoal: string
  goalProgress: number
  status: 'active' | 'inactive' | 'struggling'
}

export default function StudentProgress() {
  const [students, setStudents] = useState<StudentProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Mock data
    const mockStudents: StudentProgress[] = [
      {
        id: '1',
        name: 'Rahul Sharma',
        ideasSubmitted: 8,
        averageScore: 78,
        improvement: 15,
        lastActivity: '2 hours ago',
        currentGoal: 'Improve market research skills',
        goalProgress: 65,
        status: 'active'
      },
      {
        id: '2',
        name: 'Priya Patel',
        ideasSubmitted: 12,
        averageScore: 85,
        improvement: 22,
        lastActivity: '1 day ago',
        currentGoal: 'Develop financial projections',
        goalProgress: 40,
        status: 'active'
      },
      {
        id: '3',
        name: 'Amit Kumar',
        ideasSubmitted: 5,
        averageScore: 62,
        improvement: -5,
        lastActivity: '1 week ago',
        currentGoal: 'Strengthen value proposition',
        goalProgress: 25,
        status: 'struggling'
      },
      {
        id: '4',
        name: 'Sneha Gupta',
        ideasSubmitted: 15,
        averageScore: 92,
        improvement: 18,
        lastActivity: '3 hours ago',
        currentGoal: 'Scale business model',
        goalProgress: 80,
        status: 'active'
      }
    ]

    setTimeout(() => {
      setStudents(mockStudents)
      setIsLoading(false)
    }, 1000)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'struggling': return 'bg-red-100 text-red-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {students.length === 0 ? (
        <div className="text-center py-8">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No students assigned</h3>
          <p className="text-muted-foreground">
            Students you&apos;re mentoring will appear here.
          </p>
        </div>
      ) : (
        students.map((student) => (
          <Card key={student.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={student.avatar} alt={student.name} />
                    <AvatarFallback>
                      {getInitials(student.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{student.name}</h4>
                      <Badge className={getStatusColor(student.status)}>
                        {student.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                      <div>
                        <span className="font-medium text-foreground">{student.ideasSubmitted}</span> ideas submitted
                      </div>
                      <div>
                        Avg score: <span className="font-medium text-foreground">{student.averageScore}/100</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {student.improvement >= 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        )}
                        <span className={student.improvement >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {student.improvement >= 0 ? '+' : ''}{student.improvement}% improvement
                        </span>
                      </div>
                      <div>
                        Last active: {student.lastActivity}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          <span className="font-medium">Current Goal:</span>
                        </div>
                        <span className="text-muted-foreground">{student.goalProgress}%</span>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{student.currentGoal}</p>
                        <Progress value={student.goalProgress} className="h-2" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/mentor/student/${student.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
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
      
      <div className="text-center pt-4">
        <Button variant="outline">
          View All Students
        </Button>
      </div>
    </div>
  )
}
