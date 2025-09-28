'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react'
import { cn, formatFileSize } from '@/lib/utils'
import { ACCEPTED_IMAGE_TYPES, ACCEPTED_AUDIO_TYPES, ACCEPTED_DOCUMENT_TYPES, MAX_FILE_SIZE } from '@/lib/constants'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'

interface FileUploadZoneProps {
  onTextExtracted?: (text: string) => void
  acceptedTypes?: string[]
  maxFiles?: number
}

interface UploadedFile {
  file: File
  id: string
  progress: number
  status: 'uploading' | 'success' | 'error'
  extractedText?: string
  error?: string
}

export default function FileUploadZone({ 
  onTextExtracted,
  acceptedTypes = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_AUDIO_TYPES, ...ACCEPTED_DOCUMENT_TYPES],
  maxFiles = 5
}: FileUploadZoneProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36),
      progress: 0,
      status: 'uploading' as const
    }))

    setFiles(prev => [...prev, ...newFiles])

    // Process each file
    for (const uploadedFile of newFiles) {
      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setFiles(prev => prev.map(f => 
            f.id === uploadedFile.id 
              ? { ...f, progress: Math.min(f.progress + 10, 90) }
              : f
          ))
        }, 200)

        const result = await apiClient.uploadFile({
          file: uploadedFile.file,
          type: uploadedFile.file.type.startsWith('image/') ? 'handwriting' : 
                uploadedFile.file.type.startsWith('audio/') ? 'audio' : 'document'
        })

        clearInterval(progressInterval)

        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { 
                ...f, 
                progress: 100, 
                status: 'success' as const,
                extractedText: result.extractedText 
              }
            : f
        ))

        if (result.extractedText && onTextExtracted) {
          onTextExtracted(result.extractedText)
        }

        toast.success(`${uploadedFile.file.name} uploaded successfully`)

      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { 
                ...f, 
                progress: 0, 
                status: 'error' as const,
                error: 'Upload failed' 
              }
            : f
        ))

        toast.error(`Failed to upload ${uploadedFile.file.name}`)
      }
    }
  }, [onTextExtracted])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: MAX_FILE_SIZE,
    maxFiles,
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach(rejection => {
        toast.error(`${rejection.file.name}: ${rejection.errors[0]?.message}`)
      })
    }
  })

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const retryUpload = (id: string) => {
    const file = files.find(f => f.id === id)
    if (file) {
      onDrop([file.file])
      setFiles(prev => prev.filter(f => f.id !== id))
    }
  }

  return (
    <div className="space-y-4">
      <Card 
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          files.length >= maxFiles && "opacity-50 cursor-not-allowed"
        )}
      >
        <CardContent className="p-8 text-center">
          <input {...getInputProps()} disabled={files.length >= maxFiles} />
          
          <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          
          <h3 className="text-lg font-semibold mb-2">
            {isDragActive ? 'Drop files here' : 'Upload Files'}
          </h3>
          
          <p className="text-muted-foreground mb-4">
            Drag and drop your files here, or click to browse
          </p>
          
          <div className="text-sm text-muted-foreground">
            <p>Supported: Images (handwriting), Audio, Documents</p>
            <p>Max size: {formatFileSize(MAX_FILE_SIZE)} per file</p>
            <p>Max files: {maxFiles}</p>
          </div>
        </CardContent>
      </Card>

      {/* Rest of the component remains the same... */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Uploaded Files</h4>
          {files.map((uploadedFile) => (
            <Card key={uploadedFile.id} className="p-4">
              <div className="flex items-center gap-3">
                <File className="h-8 w-8 text-muted-foreground" />
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{uploadedFile.file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(uploadedFile.file.size)}
                  </p>
                  
                  {uploadedFile.status === 'uploading' && (
                    <Progress value={uploadedFile.progress} className="mt-2" />
                  )}
                  
                  {uploadedFile.extractedText && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      Text extracted: {uploadedFile.extractedText.substring(0, 100)}...
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {uploadedFile.status === 'success' && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  
                  {uploadedFile.status === 'error' && (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => retryUpload(uploadedFile.id)}
                      >
                        Retry
                      </Button>
                    </>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeFile(uploadedFile.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
