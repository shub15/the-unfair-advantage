'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ImageIcon, Camera, FileImage, Loader2 } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/lib/utils'
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from '@/lib/constants'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'

interface HandwritingUploadProps {
  onTextExtracted?: (text: string) => void
}

interface HandwritingResult {
  extractedText: string
  confidence: number
  detectedLanguage: string
}

export default function HandwritingUpload({ onTextExtracted }: HandwritingUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [result, setResult] = useState<HandwritingResult | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')

  const processImage = async (file: File) => {
    try {
      setIsProcessing(true)
      setUploadProgress(0)
      
      // Create preview
      const preview = URL.createObjectURL(file)
      setPreviewUrl(preview)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const uploadResult = await apiClient.uploadFile({
        file,
        type: 'handwriting'
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (uploadResult.extractedText) {
        const handwritingResult: HandwritingResult = {
          extractedText: uploadResult.extractedText,
          confidence: 0.85, // This would come from the API
          detectedLanguage: 'auto' // This would come from the API
        }

        setResult(handwritingResult)
        
        if (onTextExtracted) {
          onTextExtracted(handwritingResult.extractedText)
        }

        toast.success(`Text extracted successfully. Found ${handwritingResult.extractedText.length} characters`)
      }

    } catch (error) {
      toast.error('Failed to extract text from image. Please try again.')
    } finally {
      setIsProcessing(false)
      setUploadProgress(0)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED_IMAGE_TYPES.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        await processImage(acceptedFiles[0])
      }
    },
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach(rejection => {
        toast.error(`${rejection.file.name}: ${rejection.errors[0]?.message}`)
      })
    }
  })

  const captureFromCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on mobile
      })
      
      // Create video element for camera preview
      const video = document.createElement('video')
      video.srcObject = stream
      video.play()
      
      // This would typically open a camera interface
      // For now, we'll show a placeholder message
      toast.info('Camera capture will be implemented in the next version')
      
      // Stop camera stream
      stream.getTracks().forEach(track => track.stop())
    } catch (error) {
      toast.error('Please allow camera access to capture handwriting')
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Options */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card 
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed cursor-pointer transition-colors",
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
          )}
        >
          <CardContent className="p-6 text-center">
            <input {...getInputProps()} />
            <FileImage className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <h4 className="font-medium mb-1">Upload Image</h4>
            <p className="text-sm text-muted-foreground">
              {isDragActive ? 'Drop image here' : 'Drag & drop or click'}
            </p>
          </CardContent>
        </Card>

        <Card 
          className="border-2 border-dashed cursor-pointer transition-colors hover:border-primary hover:bg-primary/5"
          onClick={captureFromCamera}
        >
          <CardContent className="p-6 text-center">
            <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <h4 className="font-medium mb-1">Take Photo</h4>
            <p className="text-sm text-muted-foreground">
              Capture handwriting
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-medium">Processing handwriting...</p>
                <Progress value={uploadProgress} className="mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview and Results */}
      {previewUrl && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Image Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Uploaded Image</CardTitle>
            </CardHeader>
            <CardContent>
              <img 
                src={previewUrl} 
                alt="Handwriting preview"
                className="w-full h-48 object-contain border rounded"
              />
            </CardContent>
          </Card>

          {/* Extracted Text */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Extracted Text
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Confidence: {Math.round(result.confidence * 100)}%
                </div>
                
                <div className="p-3 bg-muted rounded text-sm max-h-32 overflow-y-auto">
                  {result.extractedText}
                </div>
                
                <Button 
                  onClick={() => result && onTextExtracted?.(result.extractedText)}
                  className="w-full"
                  size="sm"
                >
                  Use This Text
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Instructions */}
      {!previewUrl && !isProcessing && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Tips for better text extraction:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Ensure good lighting and clear handwriting</li>
              <li>• Take photos straight-on, not at an angle</li>
              <li>• Use dark ink on light paper for best results</li>
              <li>• Supported formats: JPG, PNG, WebP</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
