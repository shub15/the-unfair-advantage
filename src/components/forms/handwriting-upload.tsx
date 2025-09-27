'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Camera, FileImage, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/lib/utils'
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from '@/lib/constants'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import CameraModal from '@/components/ui/camera-modal'

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
  const [showCameraModal, setShowCameraModal] = useState(false)
  const [error, setError] = useState<string>('')

  const processImage = async (file: File) => {
    try {
      setIsProcessing(true)
      setUploadProgress(0)
      setError('')
      
      // Create preview
      const preview = URL.createObjectURL(file)
      setPreviewUrl(preview)

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 300)

      console.log('Processing file:', file.name, 'Size:', file.size)

      // Upload to your backend
      const uploadResult = await apiClient.uploadFile({
        file,
        type: 'handwriting'
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (uploadResult.success && uploadResult.extractedText) {
        const handwritingResult: HandwritingResult = {
          extractedText: uploadResult.extractedText,
          confidence: uploadResult.confidence || 0.85,
          detectedLanguage: uploadResult.detectedLanguage || 'auto'
        }

        setResult(handwritingResult)
        
        if (onTextExtracted) {
          onTextExtracted(handwritingResult.extractedText)
        }

        toast.success(
          `Text extracted successfully! Found ${handwritingResult.extractedText.length} characters with ${Math.round(handwritingResult.confidence * 100)}% confidence`
        )
      } else {
        throw new Error(uploadResult.error || 'Failed to extract text from image')
      }

    } catch (error: any) {
      console.error('Image processing error:', error)
      setError(error.message || 'Failed to extract text from image')
      toast.error('Failed to extract text. Please try again with a clearer image.')
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
        const error = rejection.errors[0]?.message || 'File rejected'
        toast.error(`${rejection.file.name}: ${error}`)
      })
    }
  })

  const handleCameraCapture = async (file: File) => {
    await processImage(file)
    setShowCameraModal(false)
  }

  const openCamera = () => {
    // Check if camera is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('Camera is not available in this browser')
      return
    }
    
    setShowCameraModal(true)
  }

  const clearResults = () => {
    setResult(null)
    setPreviewUrl('')
    setError('')
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Options */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card 
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed cursor-pointer transition-colors hover:border-primary hover:bg-primary/5",
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            isProcessing && "pointer-events-none opacity-50"
          )}
        >
          <CardContent className="p-6 text-center">
            <input {...getInputProps()} />
            <FileImage className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <h4 className="font-medium mb-1">Upload Image</h4>
            <p className="text-sm text-muted-foreground">
              {isDragActive ? 'Drop image here' : 'Drag & drop or click to select'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max {MAX_FILE_SIZE / (1024 * 1024)}MB • JPG, PNG, WebP
            </p>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "border-2 border-dashed cursor-pointer transition-colors hover:border-primary hover:bg-primary/5",
            isProcessing && "pointer-events-none opacity-50"
          )}
          onClick={openCamera}
        >
          <CardContent className="p-6 text-center">
            <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <h4 className="font-medium mb-1">Take Photo</h4>
            <p className="text-sm text-muted-foreground">
              Capture handwriting with camera
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Works best in good lighting
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Processing handwriting...</p>
                <p className="text-xs text-muted-foreground">
                  Extracting text from your image using AI
                </p>
                <Progress value={uploadProgress} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Processing Failed</p>
                <p className="text-xs text-red-600">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={clearResults}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview and Results */}
      {previewUrl && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Image Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileImage className="h-5 w-5" />
                Uploaded Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <img 
                  src={previewUrl} 
                  alt="Handwriting preview"
                  className="w-full h-48 object-contain border rounded bg-muted"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearResults}
                  className="absolute top-2 right-2"
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Extracted Text */}
          {result && (
            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Extracted Text
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Confidence: <span className="font-medium">{Math.round(result.confidence * 100)}%</span>
                  </span>
                  <span className="text-muted-foreground">
                    Characters: <span className="font-medium">{result.extractedText.length}</span>
                  </span>
                </div>
                
                <div className="p-3 bg-muted rounded text-sm max-h-32 overflow-y-auto">
                  {result.extractedText || 'No text detected'}
                </div>
                
                <Button 
                  onClick={() => result && onTextExtracted?.(result.extractedText)}
                  className="w-full"
                  size="sm"
                  disabled={!result.extractedText}
                >
                  Use This Text
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Instructions */}
      {!previewUrl && !isProcessing && !error && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">📝 Tips for best results:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Use good lighting and avoid shadows</li>
              <li>• Take photos straight-on, not at an angle</li>
              <li>• Use dark ink on light paper</li>
              <li>• Ensure handwriting is clear and legible</li>
              <li>• Try to fit the entire text in the frame</li>
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Camera Modal */}
      <CameraModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  )
}
