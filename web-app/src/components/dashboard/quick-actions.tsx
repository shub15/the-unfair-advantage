'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  Users, 
  Award
} from 'lucide-react'

export default function QuickActions() {
  const actions = [
    {
      title: 'View Results',
      description: 'Check your latest evaluations',
      icon: BarChart3,
      href: '/results',
      variant: 'outline' as const
    },
    {
      title: 'Find Mentors',
      description: 'Connect with industry experts',
      icon: Users,
      href: '/mentors',
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
                className="h-auto p-4 justify-start"
                asChild
              >
                <Link href={action.href}>
                  {/* FIX: Replaced flexbox with a robust CSS Grid layout to prevent text overflow */}
                  <div className="grid grid-cols-[auto_1fr] items-start gap-3 text-left w-full">
                    <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div className="w-full">
                      <div className="font-medium">
                        {action.title}
                      </div>
                      <div className="text-sm text-muted-foreground whitespace-normal">
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