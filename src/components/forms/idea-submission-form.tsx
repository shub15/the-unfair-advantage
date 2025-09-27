'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { businessIdeaSchema, BusinessIdeaForm } from '@/lib/validation'
import { INDUSTRIES, SUPPORTED_LANGUAGES } from '@/lib/constants'
import FileUploadZone from './file-upload-zone'
import AudioRecorder from './audio-recorder'
import HandwritingUpload from './handwriting-upload'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { Loader2 } from 'lucide-react'

export default function IdeaSubmissionForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [extractedText, setExtractedText] = useState('')

  const form = useForm<BusinessIdeaForm>({
    resolver: zodResolver(businessIdeaSchema),
    defaultValues: {
      title: '',
      description: '',
      industry: undefined,
      targetMarket: '',
      language: 'en'
    }
  })

  const handleTextExtraction = (text: string) => {
    setExtractedText(text)
    form.setValue('description', form.getValues('description') + ' ' + text)
  }

  const onSubmit = async (data: BusinessIdeaForm) => {
    try {
      setIsSubmitting(true)
      const result = await apiClient.evaluateIdea(data)
      
      toast.success('Your business idea has been submitted for evaluation!')

      // Redirect to results page
      window.location.href = `/results/${result.id}`
    } catch (error) {
      toast.error('Failed to submit your idea. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Language Selection */}
        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Language</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                    <SelectItem key={code} value={code}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Input Methods */}
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="text">Type Text</TabsTrigger>
                <TabsTrigger value="handwriting">Handwriting</TabsTrigger>
                <TabsTrigger value="audio">Voice Record</TabsTrigger>
                <TabsTrigger value="file">Upload File</TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-4 mt-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Idea Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your business idea title..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detailed Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your business idea in detail..."
                          className="min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="handwriting" className="mt-6">
                <HandwritingUpload onTextExtracted={handleTextExtraction} />
              </TabsContent>

              <TabsContent value="audio" className="mt-6">
                <AudioRecorder onTranscriptionComplete={handleTextExtraction} />
              </TabsContent>

              <TabsContent value="file" className="mt-6">
                <FileUploadZone onTextExtracted={handleTextExtraction} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Industry</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {INDUSTRIES.map((industry) => (
                      <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="targetMarket"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Market</FormLabel>
                <FormControl>
                  <Input placeholder="Who is your target audience?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Extracted Text Preview */}
        {extractedText && (
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Extracted Text:</h4>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                {extractedText}
              </p>
            </CardContent>
          </Card>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Evaluating Idea...
            </>
          ) : (
            'Submit for Evaluation'
          )}
        </Button>
      </form>
    </Form>
  )
}
