import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import EvaluationCard from '@/components/evaluation/evaluation-card'
import ScoreVisualization from '@/components/evaluation/score-visualization'
import FeedbackPanel from '@/components/evaluation/feedback-panel'
import Header from '@/components/layout/header'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// This would typically fetch data based on the ID
export default function ResultsPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-20 pb-16">
        <div className="max-w-7xl mx-auto">
          {/* Back Navigation */}
          <div className="mb-6">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          {/* Page Header */}
          <div className="flex items-center mb-8">
            <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
            <h1 className="text-3xl font-bold">Evaluation Results</h1>
          </div>
          
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-8 space-y-6">
              <EvaluationCard />
              <FeedbackPanel />
            </div>
            
            {/* Sidebar */}
            <div className="lg:col-span-4">
              <ScoreVisualization />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
