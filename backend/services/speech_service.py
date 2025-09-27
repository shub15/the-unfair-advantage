"""
Speech-to-text service for processing audio files
"""

from google.cloud import speech
import io
import logging

class SpeechService:
    def __init__(self):
        self.client = speech.SpeechClient()
        self.logger = logging.getLogger(__name__)
    
    def transcribe_audio(self, audio_path, language_code='en-IN'):
        """Convert audio to text with language detection"""
        try:
            with io.open(audio_path, 'rb') as audio_file:
                content = audio_file.read()
            
            audio = speech.RecognitionAudio(content=content)
            
            config = speech.RecognitionConfig(
                encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
                sample_rate_hertz=16000,
                language_code=language_code,
                alternative_language_codes=[
                    'hi-IN', 'bn-IN', 'ta-IN', 'te-IN', 'mr-IN',
                    'gu-IN', 'kn-IN', 'ml-IN', 'pa-IN'
                ],
                enable_automatic_punctuation=True,
                enable_word_confidence=True,
                model='latest_long'
            )
            
            # Perform the transcription
            response = self.client.recognize(config=config, audio=audio)
            
            if not response.results:
                return {'error': 'No audio transcription results'}
            
            # Process results
            transcriptions = []
            for result in response.results:
                alternative = result.alternatives[0]
                transcriptions.append({
                    'transcript': alternative.transcript,
                    'confidence': alternative.confidence,
                    'words': [
                        {
                            'word': word.word,
                            'confidence': word.confidence,
                            'start_time': word.start_time.total_seconds(),
                            'end_time': word.end_time.total_seconds()
                        }
                        for word in alternative.words
                    ]
                })
            
            return {
                'transcriptions': transcriptions,
                'detected_language': language_code,
                'full_transcript': ' '.join([t['transcript'] for t in transcriptions])
            }
            
        except Exception as e:
            self.logger.error(f"Speech transcription failed: {str(e)}")
            return {'error': str(e)}
