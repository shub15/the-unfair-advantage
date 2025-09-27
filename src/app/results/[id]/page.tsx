'use client'

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EvaluationCard from '@/components/evaluation/evaluation-card';
import ScoreVisualization from '@/components/evaluation/score-visualization';
import FeedbackPanel from '@/components/evaluation/feedback-panel';
import Header from '@/components/layout/header';
import { CheckCircle, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { EvaluationResponse } from '@/lib/api-client';

function ResultsContent({ id }: { id: string }) {
  const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    const dataStr = searchParams.get('data');

    if (dataStr) {
      try {
        const data = JSON.parse(decodeURIComponent(dataStr));
        setEvaluation(data);
      } catch (e) {
        setError("Failed to parse evaluation data from URL.");
      }
    } else {
      setError("Report data not found in URL. Please upload a document again.");
    }

    setIsLoading(false);
  }, [id, searchParams]);
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading report...</p>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
       <div className="flex min-h-screen items-center justify-center text-center p-4">
        <div>
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4"/>
          <h2 className="text-xl font-semibold mb-2">Could Not Display Report</h2>
          <p className="text-muted-foreground mb-4">{error || "No evaluation data was found."}</p>
          <Button asChild>
            <Link href="/evaluate">Evaluate a New Idea</Link>
          </Button>
        </div>
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
            <h1 className="text-3xl font-bold">Evaluation Results</h1>
          </div>
          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <EvaluationCard evaluation={evaluation} />
              <FeedbackPanel feedback={evaluation} />
            </div>
            <div className="lg:col-span-4">
              <ScoreVisualization scores={evaluation} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// **FIX: Wrap the main component in Suspense to allow useSearchParams to function correctly**
export default function ResultsPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading...</p>
      </div>
    }>
      <ResultsContent id={params.id} />
    </Suspense>
  )
}