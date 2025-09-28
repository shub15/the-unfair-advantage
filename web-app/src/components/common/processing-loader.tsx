'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const EVALUATION_CRITERIA = [
  "Market Potential",
  "Feasibility",
  "Innovation",
  "Scalability",
  "Financial Viability",
];

export default function ProcessingLoader() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState<boolean[]>(new Array(EVALUATION_CRITERIA.length).fill(false));

  useEffect(() => {
    const interval = setInterval(() => {
      setCompleted(prev => {
        const newCompleted = [...prev];
        if (currentIndex < newCompleted.length) {
          newCompleted[currentIndex] = true;
        }
        return newCompleted;
      });
      setCurrentIndex(prev => (prev + 1));
    }, 1000); // Cycle through criteria every 1 second

    return () => clearInterval(interval);
  }, [currentIndex]);

  const displayedCriteria = EVALUATION_CRITERIA.slice(0, currentIndex + 1);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">Evaluating Your Idea...</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Our AI is analyzing your document against key business parameters.
          </p>
          
          <div className="space-y-3 w-full max-w-sm">
            {EVALUATION_CRITERIA.map((criterion, index) => (
              <div
                key={criterion}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-all duration-500",
                  currentIndex > index ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted/50'
                )}
              >
                {currentIndex > index ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                   <Loader2 className={cn("h-5 w-5 text-muted-foreground", currentIndex === index && "animate-spin text-primary")} />
                )}
                <span className={cn("font-medium", currentIndex > index && "text-green-800 dark:text-green-300")}>
                  {criterion}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}