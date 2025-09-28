'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, X, RotateCcw, Download, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface CameraModalProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (file: File) => void
}

// A state machine to manage the camera's status
type CameraStatus = 'idle' | 'starting' | 'streaming' | 'captured' | 'error'

export default function CameraModal({ isOpen, onClose, onCapture }: CameraModalProps) {
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [error, setError] = useState<string | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Safely stops the camera stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }, [stream])

  // Starts the camera, now initiated by a user click
  const startCamera = useCallback(async (mode: 'user' | 'environment') => {
    setStatus('starting')
    setError(null)

    if (stream) {
      stopCamera()
    }
    
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera access is not supported in this browser.')
      setStatus('error')
      return
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      })

      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play().catch(err => {
          console.error("Video play error:", err)
          setError("Could not start camera preview.")
          setStatus('error')
        })
      }
    } catch (err: any) {
      let errorMessage = 'Failed to access camera.'
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied. Please allow permissions in your browser settings.'
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.'
      }
      setError(errorMessage)
      setStatus('error')
    }
  }, [stream, stopCamera])
  
  // Sets status to 'streaming' once the video is ready to play
  const handleCanPlay = () => {
    setStatus('streaming')
  }

  // Captures a photo from the video feed
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || status !== 'streaming') {
      toast.error('Camera not ready for capture')
      return
    }

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (!context) throw new Error('Failed to get canvas context')

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9)
      if (imageDataUrl === 'data:,') throw new Error('Canvas is empty')

      setCapturedImage(imageDataUrl)
      stopCamera()
      setStatus('captured')
      toast.success('Photo captured!')

    } catch (error) {
      console.error('Error capturing photo:', error)
      toast.error('Failed to capture photo. Please try again.')
    }
  }, [status, stopCamera])

  // Converts the captured image to a file and passes it to the parent
  const usePhoto = useCallback(() => {
    if (capturedImage && canvasRef.current) {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
          onCapture(file)
          onClose() // Close modal after successful capture
        } else {
          toast.error('Failed to create image file')
        }
      }, 'image/jpeg', 0.9)
    }
  }, [capturedImage, onCapture, onClose])

  // Resets the component to retake a photo
  const retakePhoto = useCallback(() => {
    setCapturedImage(null)
    startCamera(facingMode)
  }, [startCamera, facingMode])
  
  // Switches between front and back cameras
  const switchCamera = useCallback(() => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(newFacingMode)
    startCamera(newFacingMode)
  }, [facingMode, startCamera])

  // Cleanup effect when the modal is closed or unmounted
  useEffect(() => {
    if (!isOpen) {
      stopCamera()
      setCapturedImage(null)
      setError(null)
      setStatus('idle')
    }

    return () => stopCamera()
  }, [isOpen, stopCamera])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Capture Handwriting
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-0 relative">
              <div className="relative bg-black rounded overflow-hidden" style={{ aspectRatio: '16/9' }}>
                {status !== 'captured' && (
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                    onCanPlay={handleCanPlay}
                    style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                  />
                )}
                
                {capturedImage && (
                    <img src={capturedImage} alt="Captured handwriting" className="w-full h-full object-contain" />
                )}

                {status === 'idle' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                    <Camera className="h-10 w-10 text-white mb-4" />
                    <Button onClick={() => startCamera(facingMode)}>Start Camera</Button>
                  </div>
                )}
                
                {status === 'starting' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <div className="text-center text-white">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p>Starting camera...</p>
                    </div>
                  </div>
                )}

                {status === 'error' && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-4">
                      <AlertCircle className="h-8 w-8 text-destructive mb-2"/>
                      <p className="text-destructive-foreground text-center mb-4">{error}</p>
                      <Button onClick={() => startCamera(facingMode)} variant="destructive">Try Again</Button>
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-center">
            {status === 'streaming' && (
              <>
                <Button variant="outline" size="icon" onClick={switchCamera}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button onClick={capturePhoto} size="lg" className="rounded-full h-16 w-16">
                  <Camera className="h-6 w-6" />
                </Button>
                <Button variant="outline" size="icon" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
              </>
            )}

            {status === 'captured' && (
              <>
                <Button variant="outline" onClick={retakePhoto} className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake
                </Button>
                <Button onClick={usePhoto} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Use Photo
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

