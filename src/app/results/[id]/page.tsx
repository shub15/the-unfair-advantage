import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import EvaluationCard from '@/components/evaluation/evaluation-card'
import ScoreVisualization from '@/components/evaluation/score-visualization'
import FeedbackPanel from '@/components/evaluation/feedback-panel'
import Header from '@/components/layout/header'
import { CheckCircle } from 'lucide-react'

// This would typically fetch data based on the ID
export default function ResultsPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-20 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center mb-8">
            <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
            <h1 className="text-3xl font-bold">Evaluation Results</h1>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <EvaluationCard />
              <FeedbackPanel />
            </div>
            
            <div>
              <ScoreVisualization />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
