'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  PlusCircle, 
  FileText, 
  BarChart3, 
  Users, 
  Settings,
  BookOpen,
  MessageSquare,
  Award
} from 'lucide-react'

export default function QuickActions() {
  const actions = [
    {
      title: 'New Evaluation',
      description: 'Submit a business idea for AI analysis',
      icon: PlusCircle,
      href: '/evaluate',
      variant: 'default' as const,
      featured: true
    },
    {
      title: 'View Results',
      description: 'Check your latest evaluations',
      icon: BarChart3,
      href: '/results',
      variant: 'outline' as const
    },
    {
      title: 'Browse Ideas',
      description: 'Explore successful business concepts',
      icon: FileText,
      href: '/browse',
      variant: 'outline' as const
    },
    {
      title: 'Find Mentors',
      description: 'Connect with industry experts',
      icon: Users,
      href: '/mentors',
      variant: 'outline' as const
    },
    {
      title: 'Learning Hub',
      description: 'Access entrepreneurship resources',
      icon: BookOpen,
      href: '/learn',
      variant: 'outline' as const
    },
    {
      title: 'Community',
      description: 'Join entrepreneur discussions',
      icon: MessageSquare,
      href: '/community',
      variant: 'outline' as const
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {actions.map((action) => {
            const Icon = action.icon
            
            return (
              <Button
                key={action.title}
                variant={action.variant}
                className={`h-auto p-4 justify-start ${
                  action.featured ? 'bg-primary hover:bg-primary/90' : ''
                }`}
                asChild
              >
                <Link href={action.href}>
                  <div className="flex items-start gap-3 text-left">
                    <Icon className={`h-5 w-5 mt-0.5 ${
                      action.featured ? 'text-primary-foreground' : 'text-muted-foreground'
                    }`} />
                    <div>
                      <div className={`font-medium ${
                        action.featured ? 'text-primary-foreground' : ''
                      }`}>
                        {action.title}
                      </div>
                      <div className={`text-sm ${
                        action.featured ? 'text-primary-foreground/80' : 'text-muted-foreground'
                      }`}>
                        {action.description}
                      </div>
                    </div>
                  </div>
                </Link>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
