'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Mic, Pause, Square, Trash2, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SUPPORTED_LANGUAGES } from '@/lib/constants'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { useAudioRecorder } from '@/hooks/use-audio-recorder'

interface AudioRecorderProps {
  onTranscriptionComplete?: (text: string) => void
}

export default function AudioRecorder({ onTranscriptionComplete }: AudioRecorderProps) {
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcription, setTranscription] = useState('')

  const {
    isRecording,
    isPaused,
    recordingTime,
    audioLevel,
    audioUrl,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
    audioBlob
  } = useAudioRecorder()

  const handleTranscribe = async () => {
    if (!audioBlob) {
      toast.error('No recording found. Please record audio first.')
      return
    }

    try {
      setIsTranscribing(true)
      const result = await apiClient.transcribeAudio(audioBlob)
      
      setTranscription(result.text)
      
      if (onTranscriptionComplete) {
        onTranscriptionComplete(result.text)
      }

      toast.success(`Transcription complete with ${Math.round(result.confidence * 100)}% confidence`)
    } catch (error) {
      toast.error('Failed to transcribe audio. Please try again.')
    } finally {
      setIsTranscribing(false)
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const downloadAudio = () => {
    if (audioUrl) {
      const a = document.createElement('a')
      a.href = audioUrl
      a.download = `recording-${Date.now()}.wav`
      a.click()
    }
  }

  return (
    <div className="space-y-4">
      {/* Language Selection */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Recording Language:</label>
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
              <SelectItem key={code} value={code}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Recording Controls */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-4">
              {!isRecording && !audioUrl && (
                <Button 
                  onClick={startRecording}
                  size="lg"
                  className="rounded-full h-16 w-16"
                >
                  <Mic className="h-6 w-6" />
                </Button>
              )}

              {isRecording && (
                <>
                  {!isPaused ? (
                    <Button 
                      onClick={pauseRecording}
                      variant="outline"
                      size="lg"
                      className="rounded-full h-16 w-16"
                    >
                      <Pause className="h-6 w-6" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={resumeRecording}
                      size="lg"
                      className="rounded-full h-16 w-16"
                    >
                      <Mic className="h-6 w-6" />
                    </Button>
                  )}
                  
                  <Button 
                    onClick={stopRecording}
                    variant="destructive"
                    size="lg"
                    className="rounded-full h-16 w-16"
                  >
                    <Square className="h-6 w-6" />
                  </Button>
                </>
              )}
            </div>

            {/* Recording Status */}
            <div className="space-y-2">
              <div className="text-2xl font-mono">
                {formatTime(recordingTime)}
              </div>
              
              {isRecording && (
                <div className="flex items-center justify-center gap-2">
                  <div 
                    className={cn(
                      "h-3 w-3 rounded-full animate-pulse",
                      isPaused ? "bg-yellow-500" : "bg-red-500"
                    )}
                  />
                  <span className="text-sm">
                    {isPaused ? 'Paused' : 'Recording...'}
                  </span>
                </div>
              )}

              {/* Audio Level Indicator */}
              {isRecording && !isPaused && (
                <div className="w-full max-w-xs mx-auto">
                  <Progress value={audioLevel} className="h-2" />
                </div>
              )}
            </div>

            {/* Audio Playback */}
            {audioUrl && (
              <div className="space-y-4">
                <audio controls className="w-full">
                  <source src={audioUrl} type="audio/wav" />
                </audio>
                
                <div className="flex justify-center gap-2">
                  <Button 
                    onClick={handleTranscribe}
                    disabled={isTranscribing}
                  >
                    {isTranscribing ? 'Transcribing...' : 'Transcribe'}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={downloadAudio}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={clearRecording}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>
            )}

            {/* Instructions */}
            {!isRecording && !audioUrl && (
              <p className="text-muted-foreground text-sm">
                Click the microphone to start recording your business idea
              </p>
            )}
          </div>

          {/* Transcription Results */}
          {transcription && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Transcription:</h4>
              <p className="text-sm">{transcription}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
