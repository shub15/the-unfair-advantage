import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import IdeaSubmissionForm from '@/components/forms/idea-submission-form'
import Header from '@/components/layout/header'
import { Lightbulb } from 'lucide-react'
import ProtectedRoute from '@/components/auth/protected-route'

export default function EvaluatePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ProtectedRoute>
      <main className="container mx-auto px-4 pt-20 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Lightbulb className="h-8 w-8 text-primary mr-2" />
              <h1 className="text-3xl font-bold">Submit Your Business Idea</h1>
            </div>
            <p className="text-muted-foreground">
              Share your business concept and receive AI-powered evaluation with expert insights
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Business Idea Evaluation Form</CardTitle>
            </CardHeader>
            <CardContent>
              <IdeaSubmissionForm />
            </CardContent>
          </Card>
        </div>
      </main>
      </ProtectedRoute>
      
    </div>
  )
}
