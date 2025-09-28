// // 'use client'

// // import { useState } from 'react'
// // import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// // import { Badge } from '@/components/ui/badge'
// // import { Button } from '@/components/ui/button'
// // import { Progress } from '@/components/ui/progress'
// // import { 
// //   Calendar, 
// //   User, 
// //   Building, 
// //   Target, 
// //   TrendingUp,
// //   Share2,
// //   Download,
// //   Bookmark,
// //   BookmarkCheck
// // } from 'lucide-react'
// // import { formatDistanceToNow } from 'date-fns'

// // interface EvaluationCardProps {
// //   evaluation?: {
// //     id: string
// //     title: string
// //     description: string
// //     industry: string
// //     targetMarket: string
// //     overallScore: number
// //     submittedAt: Date
// //     evaluatedAt: Date
// //     language: string
// //     userName: string
// //   }
// // }

// // export default function EvaluationCard({ evaluation }: EvaluationCardProps) {
// //   const [isBookmarked, setIsBookmarked] = useState(false)

// //   // Mock data if no evaluation provided
// //   const mockEvaluation = {
// //     id: 'eval_123',
// //     title: 'AI-Powered Learning Platform for Rural Students',
// //     description: 'An innovative educational technology platform that uses artificial intelligence to provide personalized learning experiences for students in rural areas. The platform adapts to each student\'s learning pace and style, providing interactive content and real-time progress tracking.',
// //     industry: 'Education',
// //     targetMarket: 'Rural students aged 10-18 in developing countries',
// //     overallScore: 85,
// //     submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
// //     evaluatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
// //     language: 'English',
// //     userName: 'John Entrepreneur'
// //   }

// //   const data = evaluation || mockEvaluation

// //   const getScoreColor = (score: number) => {
// //     if (score >= 80) return 'text-green-600'
// //     if (score >= 60) return 'text-yellow-600'
// //     if (score >= 40) return 'text-orange-600'
// //     return 'text-red-600'
// //   }

// //   const getScoreBgColor = (score: number) => {
// //     if (score >= 80) return 'bg-green-50 border-green-200'
// //     if (score >= 60) return 'bg-yellow-50 border-yellow-200'
// //     if (score >= 40) return 'bg-orange-50 border-orange-200'
// //     return 'bg-red-50 border-red-200'
// //   }

// //   const getScoreLabel = (score: number) => {
// //     if (score >= 80) return 'Excellent'
// //     if (score >= 60) return 'Good'
// //     if (score >= 40) return 'Fair'
// //     return 'Needs Improvement'
// //   }

// //   const handleShare = async () => {
// //     if (navigator.share) {
// //       try {
// //         await navigator.share({
// //           title: data.title,
// //           text: `Check out my business idea evaluation: ${data.title}`,
// //           url: window.location.href
// //         })
// //       } catch (error) {
// //         console.log('Error sharing:', error)
// //       }
// //     } else {
// //       // Fallback: copy to clipboard
// //       navigator.clipboard.writeText(window.location.href)
// //       // You could show a toast here
// //     }
// //   }

// //   const handleDownload = () => {
// //     // This would generate and download a PDF report
// //     console.log('Downloading evaluation report...')
// //     // Implementation would go here
// //   }

// //   const toggleBookmark = () => {
// //     setIsBookmarked(!isBookmarked)
// //     // Save bookmark state to backend
// //   }

// //   return (
// //     <Card className="w-full">
// //       <CardHeader>
// //         <div className="flex items-start justify-between">
// //           <div className="flex-1">
// //             <CardTitle className="text-2xl leading-tight mb-3">
// //               {data.title}
// //             </CardTitle>
            
// //             <div className="flex flex-wrap items-center gap-3 mb-4">
// //               <Badge variant="secondary">{data.industry}</Badge>
// //               <Badge variant="outline">{data.language}</Badge>
              
// //               <div className="flex items-center text-sm text-muted-foreground">
// //                 <User className="h-4 w-4 mr-1" />
// //                 {data.userName}
// //               </div>
// //             </div>
// //           </div>
          
// //           {/* Overall Score */}
// //           <div className={`p-4 rounded-lg border-2 ${getScoreBgColor(data.overallScore)}`}>
// //             <div className="text-center">
// //               <div className={`text-3xl font-bold ${getScoreColor(data.overallScore)}`}>
// //                 {data.overallScore}
// //               </div>
// //               <div className="text-sm text-muted-foreground">/ 100</div>
// //               <div className="text-xs font-medium mt-1">
// //                 {getScoreLabel(data.overallScore)}
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </CardHeader>

// //       <CardContent className="space-y-6">
// //         {/* Description */}
// //         <div>
// //           <h3 className="font-semibold mb-2">Business Description</h3>
// //           <p className="text-muted-foreground leading-relaxed">
// //             {data.description}
// //           </p>
// //         </div>

// //         {/* Target Market */}
// //         <div className="flex items-start gap-3">
// //           <Target className="h-5 w-5 text-muted-foreground mt-0.5" />
// //           <div>
// //             <h4 className="font-medium mb-1">Target Market</h4>
// //             <p className="text-sm text-muted-foreground">{data.targetMarket}</p>
// //           </div>
// //         </div>

// //         {/* Industry Category */}
// //         <div className="flex items-start gap-3">
// //           <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
// //           <div>
// //             <h4 className="font-medium mb-1">Industry</h4>
// //             <p className="text-sm text-muted-foreground">{data.industry}</p>
// //           </div>
// //         </div>

// //         {/* Timeline */}
// //         <div className="flex items-start gap-3">
// //           <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
// //           <div>
// //             <h4 className="font-medium mb-1">Timeline</h4>
// //             <div className="space-y-1 text-sm text-muted-foreground">
// //               <p>Submitted: {formatDistanceToNow(data.submittedAt, { addSuffix: true })}</p>
// //               <p>Evaluated: {formatDistanceToNow(data.evaluatedAt, { addSuffix: true })}</p>
// //             </div>
// //           </div>
// //         </div>

// //         {/* Score Progress */}
// //         <div>
// //           <div className="flex items-center justify-between mb-3">
// //             <h4 className="font-medium">Overall Performance</h4>
// //             <span className="text-sm text-muted-foreground">{data.overallScore}%</span>
// //           </div>
// //           <Progress value={data.overallScore} className="h-3" />
// //         </div>

// //         {/* Action Buttons */}
// //         <div className="flex items-center gap-2 pt-4 border-t">
// //           <Button onClick={handleShare} variant="outline" size="sm">
// //             <Share2 className="h-4 w-4 mr-2" />
// //             Share
// //           </Button>
          
// //           <Button onClick={handleDownload} variant="outline" size="sm">
// //             <Download className="h-4 w-4 mr-2" />
// //             Download Report
// //           </Button>
          
// //           <Button 
// //             onClick={toggleBookmark} 
// //             variant="ghost" 
// //             size="sm"
// //             className="ml-auto"
// //           >
// //             {isBookmarked ? (
// //               <BookmarkCheck className="h-4 w-4 text-primary" />
// //             ) : (
// //               <Bookmark className="h-4 w-4" />
// //             )}
// //           </Button>
// //         </div>
// //       </CardContent>
// //     </Card>
// //   )
// // }


// 'use client'

// import { useState } from 'react'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Badge } from '@/components/ui/badge'
// import { Button } from '@/components/ui/button'
// import { 
//   Calendar, 
//   User, 
//   Building, 
//   Share2,
//   Download,
//   Bookmark,
//   BookmarkCheck
// } from 'lucide-react'
// import { formatDistanceToNow } from 'date-fns'
// import { EvaluationResponse } from '@/lib/api-client'
// import { toast } from 'sonner'

// interface EvaluationCardProps {
//   evaluation: EvaluationResponse
// }

// export default function EvaluationCard({ evaluation }: EvaluationCardProps) {
//   const [isBookmarked, setIsBookmarked] = useState(false)

//   const data = evaluation;

//   const getScoreColor = (score: number) => {
//     if (score >= 80) return 'text-green-600'
//     if (score >= 60) return 'text-yellow-600'
//     return 'text-red-600'
//   }

//   const getScoreBgColor = (score: number) => {
//     if (score >= 80) return 'bg-green-50 border-green-200'
//     if (score >= 60) return 'bg-yellow-50 border-yellow-200'
//     return 'bg-red-50 border-red-200'
//   }

//   const getScoreLabel = (score: number) => {
//     if (score >= 80) return 'Excellent'
//     if (score >= 60) return 'Good'
//     return 'Needs Improvement'
//   }
  
//   const handleShare = () => toast.info("Share functionality coming soon!");
//   const handleDownload = () => toast.info("PDF download coming soon!");
//   const toggleBookmark = () => setIsBookmarked(!isBookmarked);

//   // **FIX: Safely format dates only if they exist**
//   const formatDateSafe = (dateString: string | undefined | null) => {
//     if (!dateString) return null;
//     try {
//       const date = new Date(dateString);
//       if (isNaN(date.getTime())) return null; // Check for invalid date
//       return formatDistanceToNow(date, { addSuffix: true });
//     } catch (e) {
//       return null;
//     }
//   };
  
//   const submittedAtFormatted = formatDateSafe(data.submitted_at);
//   const evaluatedAtFormatted = formatDateSafe(data.completed_at);

//   return (
//     <Card className="w-full">
//       <CardHeader>
//         <div className="flex items-start justify-between">
//           <div className="flex-1">
//             <CardTitle className="text-2xl leading-tight mb-3">
//               {data.structured_data?.Business_Name || 'Untitled Business Idea'}
//             </CardTitle>
            
//             <div className="flex flex-wrap items-center gap-3 mb-4">
//               <Badge variant="secondary">{data.industry || 'General'}</Badge>
//               <div className="flex items-center text-sm text-muted-foreground">
//                 <User className="h-4 w-4 mr-1" />
//                 {data.structured_data?.Entrepreneur_Name || 'N/A'}
//               </div>
//             </div>
//           </div>
          
//           {/* Overall Score */}
//           {data.overall_score != null && (
//             <div className={`p-4 rounded-lg border-2 ${getScoreBgColor(data.overall_score)}`}>
//               <div className="text-center">
//                 <div className={`text-3xl font-bold ${getScoreColor(data.overall_score)}`}>
//                   {data.overall_score}
//                 </div>
//                 <div className="text-sm text-muted-foreground">/ 100</div>
//                 <div className="text-xs font-medium mt-1">
//                   {getScoreLabel(data.overall_score)}
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </CardHeader>

//       <CardContent className="space-y-6">
//         {/* Description */}
//         <div>
//           <h3 className="font-semibold mb-2">Business Description</h3>
//           <p className="text-muted-foreground leading-relaxed">
//             {data.raw_text || data.extracted_text || "No description provided."}
//           </p>
//         </div>

//         {/* Timeline */}
//         {(submittedAtFormatted || evaluatedAtFormatted) && (
//           <div className="flex items-start gap-3">
//             <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
//             <div>
//               <h4 className="font-medium mb-1">Timeline</h4>
//               <div className="space-y-1 text-sm text-muted-foreground">
//                 {submittedAtFormatted && <p>Submitted: {submittedAtFormatted}</p>}
//                 {evaluatedAtFormatted && <p>Evaluated: {evaluatedAtFormatted}</p>}
//               </div>
//             </div>
//           </div>
//         )}
        
//         <div className="flex items-center gap-2 pt-4 border-t">
//           <Button onClick={handleShare} variant="outline" size="sm">
//             <Share2 className="h-4 w-4 mr-2" />
//             Share
//           </Button>
//           <Button onClick={handleDownload} variant="outline" size="sm">
//             <Download className="h-4 w-4 mr-2" />
//             Download Report
//           </Button>
//           <Button 
//             onClick={toggleBookmark} 
//             variant="ghost" 
//             size="sm"
//             className="ml-auto"
//           >
//             {isBookmarked ? (
//               <BookmarkCheck className="h-4 w-4 text-primary" />
//             ) : (
//               <Bookmark className="h-4 w-4" />
//             )}
//           </Button>
//         </div>
//       </CardContent>
//     </Card>
//   )
// }

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Share2, Download, FileText } from 'lucide-react';
import { EvaluationResponse } from '@/lib/api-client';
import { toast } from 'sonner';

interface EvaluationCardProps {
  evaluation: EvaluationResponse;
}

export default function EvaluationCard({ evaluation }: EvaluationCardProps) {
  const structured = evaluation.structured_data || {};

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex-1">
          <CardTitle className="text-2xl leading-tight mb-3">
            {structured.Business_Name || 'Untitled Business Idea'}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge variant="secondary">{evaluation.industry || 'General'}</Badge>
            <div className="flex items-center text-sm text-muted-foreground">
              <User className="h-4 w-4 mr-1" />
              {structured.Entrepreneur_Name || 'N/A'}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Extracted Business Description
          </h3>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap border-l-2 border-primary/20 pl-4">
            {evaluation.raw_text || evaluation.extracted_text || "No description provided."}
          </p>
        </div>
        <div className="flex items-center gap-2 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={() => toast.info("Share functionality is coming soon!")}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.info("PDF download is coming soon!")}>
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}