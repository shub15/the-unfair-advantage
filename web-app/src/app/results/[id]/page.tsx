'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/layout/header';
import { CheckCircle, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEvaluationStore } from '@/store/evaluation-store';

import EvaluationCard from '@/components/evaluation/evaluation-card';
import ScoreVisualization from '@/components/evaluation/score-visualization';
import FeedbackPanel from '@/components/evaluation/feedback-panel';

export default function ResultsPage() {
  const { evaluationResult } = useEvaluationStore();
  
  if (!evaluationResult) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <div className="w-full max-w-lg text-center">
            <Card>
              <CardHeader>
                <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <CardTitle>No Evaluation Data Found</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  It looks like you've landed on the results page directly. Please go back and upload a document to generate a new report.
                </p>
                <Button asChild>
                  <Link href="/evaluate">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Evaluation Page
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-20 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <div className="flex items-center mb-8">
            <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
            <h1 className="text-3xl font-bold">Extraction Results</h1>
          </div>
          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <EvaluationCard evaluation={evaluationResult} />
              <FeedbackPanel />
            </div>
            <div className="lg:col-span-4">
              <ScoreVisualization scores={evaluationResult} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}