// 'use client'

// import { useState } from 'react'
// import { useRouter } from 'next/navigation' // Import for redirection
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Button } from '@/components/ui/button'
// import { Camera, FileImage, CheckCircle, AlertCircle, FileText } from 'lucide-react'
// import { useDropzone } from 'react-dropzone'
// import { cn } from '@/lib/utils'
// import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from '@/lib/constants'
// import { toast } from 'sonner'
// import { apiClient } from '@/lib/api-client'
// import CameraModal from '@/components/ui/camera-modal'
// import ProcessingLoader from '@/components/common/processing-loader' // Import the new loader

// interface HandwritingUploadProps {
//   onTextExtracted?: (text: string) => void
// }

// interface HandwritingResult {
//   extractedText: string
//   confidence: number
//   detectedLanguage: string
// }

// export default function HandwritingUpload({ onTextExtracted }: HandwritingUploadProps) {
//   const [isProcessing, setIsProcessing] = useState(false)
//   const [result, setResult] = useState<HandwritingResult | null>(null)
//   const [previewUrl, setPreviewUrl] = useState<string>('')
//   const [uploadedFile, setUploadedFile] = useState<File | null>(null)
//   const [showCameraModal, setShowCameraModal] = useState(false)
//   const [error, setError] = useState<string>('')
//   const router = useRouter() // Initialize router

//   const processFile = async (file: File) => {
//     try {
//       setIsProcessing(true)
//       setError('')
//       setResult(null)
//       setUploadedFile(file)
      
//       if (file.type.startsWith('image/')) {
//         const preview = URL.createObjectURL(file)
//         setPreviewUrl(preview)
//       } else {
//         setPreviewUrl('')
//       }
      
//       let response;
//       if (file.type === 'application/pdf') {
//         response = await apiClient.uploadPdf(file, 'en-IN');
//       } else if (file.type.startsWith('image/')) {
//         response = await apiClient.uploadImage(file, 'en-IN');
//       } else {
//         throw new Error('Unsupported file type provided.');
//       }
      
//       const extractedText = response.data?.raw_text || response.data?.extracted_text;
//       const submissionId = response.data?.submission_id;

//       if (response.success && extractedText && submissionId) {
//         toast.success(`File processed successfully! Redirecting to results...`);
        
//         // Redirect to the results page
//         router.push(`/results/${submissionId}`);
        
//       } else {
//         throw new Error(response.error || 'Failed to extract text from file')
//       }

//     } catch (error: any) {
//       setError(error.message || 'Failed to process file')
//       toast.error(`Processing failed. Please try again with a clearer file.`)
//       setIsProcessing(false)
//     }
//   }
  
//   const { getRootProps, getInputProps, isDragActive } = useDropzone({
//     accept: {
//       ...ACCEPTED_IMAGE_TYPES.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
//       'application/pdf': ['.pdf']
//     },
//     maxSize: MAX_FILE_SIZE,
//     maxFiles: 1,
//     onDrop: async (acceptedFiles) => {
//       if (acceptedFiles.length > 0) {
//         await processFile(acceptedFiles[0])
//       }
//     },
//     onDropRejected: (rejectedFiles) => {
//       rejectedFiles.forEach(rejection => {
//         toast.error(`${rejection.file.name}: ${rejection.errors[0]?.message}`)
//       })
//     }
//   })

//   const handleCameraCapture = async (file: File) => {
//     await processFile(file)
//     setShowCameraModal(false)
//   }

//   const openCamera = () => {
//     if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
//       toast.error('Camera is not available in this browser')
//       return
//     }
//     setShowCameraModal(true)
//   }

//   const clearResults = () => {
//     setResult(null)
//     setPreviewUrl('')
//     setUploadedFile(null)
//     setError('')
//     if (previewUrl) {
//       URL.revokeObjectURL(previewUrl)
//     }
//   }

//   return (
//     <div className="space-y-4">
//       {isProcessing ? (
//         <ProcessingLoader />
//       ) : (
//         <>
//           {/* Upload Options */}
//           <div className="grid md:grid-cols-2 gap-4">
//             <Card 
//               {...getRootProps()}
//               className={cn(
//                 "border-2 border-dashed cursor-pointer transition-colors hover:border-primary hover:bg-primary/5",
//                 isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
//               )}
//             >
//               <CardContent className="p-6 text-center">
//                 <input {...getInputProps()} />
//                 <FileImage className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
//                 <h4 className="font-medium mb-1">Upload File</h4>
//                 <p className="text-sm text-muted-foreground">
//                   {isDragActive ? 'Drop file here' : 'Drag & drop or click to select'}
//                 </p>
//                 <p className="text-xs text-muted-foreground mt-1">
//                   Max {MAX_FILE_SIZE / (1024 * 1024)}MB • PDF, JPG, PNG
//                 </p>
//               </CardContent>
//             </Card>

//             <Card 
//               className="border-2 border-dashed cursor-pointer transition-colors hover:border-primary hover:bg-primary/5"
//               onClick={openCamera}
//             >
//               <CardContent className="p-6 text-center">
//                 <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
//                 <h4 className="font-medium mb-1">Take Photo</h4>
//                 <p className="text-sm text-muted-foreground">
//                   Capture handwriting with your camera
//                 </p>
//                  <p className="text-xs text-muted-foreground mt-1">
//                   Works best in good lighting
//                 </p>
//               </CardContent>
//             </Card>
//           </div>
//         </>
//       )}

//       {error && !isProcessing && (
//         <Card className="border-red-200 bg-red-50">
//           <CardContent className="p-4">
//             <div className="flex items-center gap-3">
//               <AlertCircle className="h-5 w-5 text-red-600" />
//               <div className="flex-1">
//                 <p className="text-sm font-medium text-red-800">Processing Failed</p>
//                 <p className="text-xs text-red-600">{error}</p>
//               </div>
//               <Button variant="outline" size="sm" onClick={clearResults}>
//                 Try Again
//               </Button>
//             </div>
//           </CardContent>
//         </Card>
//       )}

//       {uploadedFile && !isProcessing && result && (
//         <div className="grid md:grid-cols-2 gap-4">
//           <Card>
//             <CardHeader className="pb-3">
//               <CardTitle className="text-lg flex items-center gap-2">
//                 <FileText className="h-5 w-5" />
//                 Uploaded File
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="relative">
//                 {uploadedFile.type.startsWith('image/') && previewUrl ? (
//                   <img 
//                     src={previewUrl} 
//                     alt="File preview"
//                     className="w-full h-48 object-contain border rounded bg-muted"
//                   />
//                 ) : (
//                   <div className="w-full h-48 flex flex-col items-center justify-center border rounded bg-muted">
//                     <FileText className="h-16 w-16 text-muted-foreground" />
//                     <p className="text-sm text-muted-foreground mt-2 px-4 text-center truncate">
//                       {uploadedFile.name}
//                     </p>
//                   </div>
//                 )}
//                 <Button variant="outline" size="sm" onClick={clearResults} className="absolute top-2 right-2">
//                   Clear
//                 </Button>
//               </div>
//             </CardContent>
//           </Card>
          
//           <Card className="border-green-200">
//             <CardHeader className="pb-3">
//               <CardTitle className="text-lg flex items-center gap-2">
//                 <CheckCircle className="h-5 w-5 text-green-600" />
//                 Extracted Text
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-3">
//               <div className="flex justify-between text-sm">
//                 <span className="text-muted-foreground">
//                   Confidence: <span className="font-medium">{Math.round(result.confidence * 100)}%</span>
//                 </span>
//                 <span className="text-muted-foreground">
//                   Characters: <span className="font-medium">{result.extractedText.length}</span>
//                 </span>
//               </div>
              
//               <div className="p-3 bg-muted rounded text-sm max-h-32 overflow-y-auto">
//                 {result.extractedText || 'No text detected'}
//               </div>
              
//               <Button 
//                 onClick={() => result && onTextExtracted?.(result.extractedText)}
//                 className="w-full"
//                 size="sm"
//                 disabled={!result.extractedText}
//               >
//                 Use This Text
//               </Button>
//             </CardContent>
//           </Card>
//         </div>
//       )}
      
//       {!uploadedFile && !isProcessing && !error && (
//         <Card className="bg-muted/50">
//           <CardContent className="p-4">
//             <h4 className="font-medium mb-2">📝 Tips for best results:</h4>
//             <ul className="text-sm text-muted-foreground space-y-1">
//               <li>• Use good lighting and avoid shadows</li>
//               <li>• Take photos straight-on, not at an angle</li>
//               <li>• For PDFs, ensure the text is clear and scannable</li>
//               <li>• Ensure handwriting is clear and legible</li>
//             </ul>
//           </CardContent>
//         </Card>
//       )}

//       <CameraModal
//         isOpen={showCameraModal}
//         onClose={() => setShowCameraModal(false)}
//         onCapture={handleCameraCapture}
//       />
//     </div>
//   )
// }

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Camera, FileImage, AlertCircle } from 'lucide-react'
import { useDropzone } from 'react-dropzone' 
import { cn } from '@/lib/utils'
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from '@/lib/constants'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import CameraModal from '@/components/ui/camera-modal'
import ProcessingLoader from '@/components/common/processing-loader'

interface HandwritingUploadProps {
  onTextExtracted?: (text: string) => void
}

export default function HandwritingUpload({ onTextExtracted }: HandwritingUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [showCameraModal, setShowCameraModal] = useState(false);
  const router = useRouter();

  const processFile = async (file: File) => {
    try {
      setIsProcessing(true);
      setError('');
      
      let response;
      if (file.type === 'application/pdf') {
        response = await apiClient.uploadPdf(file, 'en-IN');
      } else if (file.type.startsWith('image/')) {
        response = await apiClient.uploadImage(file, 'en-IN');
      } else {
        throw new Error('Unsupported file type provided.');
      }

      const submissionId = response.data?.submission_id;

      if (response.success && response.data && submissionId) {
        toast.info("File processed. Saving results to your dashboard...");

        // Save the result to Supabase before redirecting
        const saveResponse = await apiClient.saveEvaluationResult(submissionId, response.data);

        if (!saveResponse.success) {
          throw new Error(saveResponse.error || "Could not save the report.");
        }
        
        toast.success("Report saved! Redirecting...");
        router.push(`/results/${submissionId}`);
        
      } else {
        throw new Error(response.error || 'The server did not return a valid submission ID.')
      }

    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred.');
      toast.error(error.message);
      setIsProcessing(false);
    }
  };
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      ...ACCEPTED_IMAGE_TYPES.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
      'application/pdf': ['.pdf']
    },
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        await processFile(acceptedFiles[0])
      }
    },
  });

  const handleCameraCapture = async (file: File) => {
    setShowCameraModal(false);
    await processFile(file);
  }

  const openCamera = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('Camera is not available in this browser');
      return;
    }
    setShowCameraModal(true);
  }

  return (
    <div className="space-y-4">
      {isProcessing ? <ProcessingLoader /> : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            <Card 
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed cursor-pointer transition-colors hover:border-primary hover:bg-primary/5",
                isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
              )}
            >
              <CardContent className="p-6 text-center">
                <input {...getInputProps()} />
                <FileImage className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <h4 className="font-medium mb-1">Upload File</h4>
                <p className="text-sm text-muted-foreground">
                  {isDragActive ? 'Drop file here' : 'Drag & drop or click to select'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Max {MAX_FILE_SIZE / (1024 * 1024)}MB • PDF, JPG, PNG
                </p>
              </CardContent>
            </Card>

            <Card 
              className="border-2 border-dashed cursor-pointer transition-colors hover:border-primary hover:bg-primary/5"
              onClick={openCamera}
            >
              <CardContent className="p-6 text-center">
                <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <h4 className="font-medium mb-1">Take Photo</h4>
                <p className="text-sm text-muted-foreground">
                  Capture handwriting with your camera
                </p>
                 <p className="text-xs text-muted-foreground mt-1">
                  Works best in good lighting
                </p>
              </CardContent>
            </Card>
          </div>

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">Processing Failed</p>
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setError('')}>
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!isProcessing && !error && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">📝 Tips for best results:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Use good lighting and avoid shadows</li>
                  <li>• Take photos straight-on, not at an angle</li>
                  <li>• For PDFs, ensure the text is clear and scannable</li>
                  <li>• Ensure handwriting is clear and legible</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <CameraModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  )
}