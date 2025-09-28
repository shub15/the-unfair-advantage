'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Target, 
  DollarSign, 
  Zap, 
  Rocket,
  Info,
  GraduationCap
} from 'lucide-react';

interface ScoreVisualizationProps {
  scores: {
    confidence?: number;
    structured_data?: any;
    [key: string]: any;
  }
}

export default function ScoreVisualization({ scores }: ScoreVisualizationProps) {
  const structuredData = scores.structured_data || {};
  const confidenceScore = scores.confidence ? Math.round(scores.confidence * 100) : 0;

  const keyDetails = [
    { title: 'Entrepreneur', value: structuredData.Entrepreneur_Name, icon: Zap },
    { title: 'Education', value: structuredData.Education_Status, icon: GraduationCap },
    { title: 'Loan Requirement', value: structuredData.Loan_Requirement_First_Month_INR, icon: DollarSign },
    { title: 'Key Selling Point', value: structuredData.Key_USP, icon: Rocket },
    { title: 'Product/Service', value: structuredData.Main_Product_Service, icon: Info },
  ];

  const getScoreLabel = (score: number) => {
    if (score >= 90) return { label: 'High Confidence', variant: 'default' as const };
    if (score >= 75) return { label: 'Good Confidence', variant: 'secondary' as const };
    return { label: 'Needs Review', variant: 'destructive' as const };
  };

  const scoreInfo = getScoreLabel(confidenceScore);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Extraction Confidence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-3">
            <div className="text-4xl font-bold text-primary">
              {confidenceScore}
              <span className="text-lg text-muted-foreground">/100</span>
            </div>
            <Badge variant={scoreInfo.variant}>
              {scoreInfo.label}
            </Badge>
            <Progress value={confidenceScore} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Key Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {keyDetails.map((item) => {
            if (!item.value) return null;
            const Icon = item.icon;
            return (
              <div key={item.title}>
                <h4 className="font-medium text-sm flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4 text-primary" />
                  {item.title}
                </h4>
                <p className="text-sm text-muted-foreground pl-6">
                  {item.value}
                </p>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  );
}