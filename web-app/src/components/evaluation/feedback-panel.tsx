'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Clock } from 'lucide-react'

export default function FeedbackPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          AI Analysis & Feedback
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="font-semibold">Feedback Pending</p>
            <p className="text-sm">
                Detailed AI analysis (strengths, weaknesses, etc.) will be available after the full evaluation is complete.
            </p>
        </div>
      </CardContent>
    </Card>
  )
}