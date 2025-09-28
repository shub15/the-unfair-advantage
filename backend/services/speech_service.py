"""
Enhanced Speech-to-text service for processing audio files with advanced features
"""

from google.cloud import speech_v1
import io
import logging
import tempfile
import os
from pydub import AudioSegment


class SpeechService:
    def __init__(self):
        self.client = speech_v1.SpeechClient()
        self.logger = logging.getLogger(__name__)

    def get_recognition_config(self, language_code, show_info=False):
        """Get advanced speech recognition config with speaker diarization"""
        diarization_config = speech_v1.SpeakerDiarizationConfig(
            enable_speaker_diarization=True, min_speaker_count=1, max_speaker_count=3
        )

        config_params = {
            "language_code": language_code,
            "enable_automatic_punctuation": True,
            "audio_channel_count": 1,
            "enable_word_time_offsets": True,
            "diarization_config": diarization_config,
        }

        if language_code in ["en-IN", "hi-IN"]:
            config_params["model"] = "telephony"
            if show_info:
                self.logger.info(f"Using enhanced telephony model for {language_code}")
        elif show_info:
            self.logger.info(f"Using default model for {language_code}")

        return speech_v1.RecognitionConfig(**config_params)

    def process_diarized_response(self, response):
        """Process speech recognition response with speaker diarization"""
        if not response.results:
            return "No speech detected in audio."

        words_info = []
        for result in response.results:
            for word_info in result.alternatives[0].words:
                words_info.append(
                    {
                        "word": word_info.word,
                        "speaker_tag": word_info.speaker_tag,
                        "start_time": word_info.start_time.total_seconds(),
                        "end_time": word_info.end_time.total_seconds(),
                    }
                )

        if words_info:
            transcript = ""
            current_speaker = None
            speaker_text = ""

            for word_info in words_info:
                if current_speaker != word_info["speaker_tag"]:
                    if current_speaker is not None:
                        transcript += (
                            f"\nSpeaker {current_speaker}: {speaker_text.strip()}\n"
                        )
                    current_speaker = word_info["speaker_tag"]
                    speaker_text = ""
                speaker_text += word_info["word"] + " "

            if current_speaker is not None:
                transcript += f"\nSpeaker {current_speaker}: {speaker_text.strip()}\n"
            return transcript.strip()
        else:
            # Fallback to basic transcript
            transcript = ""
            for result in response.results:
                transcript += result.alternatives[0].transcript + " "
            return transcript.strip()

    def transcribe_audio_chunks(self, audio_file, language_code, audio_segment):
        """Process long audio files by splitting into chunks"""
        chunk_length_ms = 50 * 1000
        chunks = []

        self.logger.info(
            f"Processing audio in chunks (duration: {len(audio_segment)/1000:.1f} seconds)..."
        )

        for i in range(0, len(audio_segment), chunk_length_ms):
            chunk = audio_segment[i : i + chunk_length_ms]
            chunks.append(chunk)

        full_transcript = ""

        for i, chunk in enumerate(chunks):
            chunk_file_path = None
            try:
                self.logger.info(f"Processing chunk {i+1} of {len(chunks)}...")
                chunk_file_path = tempfile.mktemp(suffix=".wav")
                chunk.export(chunk_file_path, format="wav")

                with open(chunk_file_path, "rb") as f:
                    content = f.read()

                audio = speech_v1.RecognitionAudio(content=content)
                config = self.get_recognition_config(language_code, show_info=False)
                response = self.client.recognize(config=config, audio=audio)

                chunk_transcript = self.process_diarized_response(response)
                full_transcript += f"\n--- Chunk {i+1} ---\n{chunk_transcript}\n"

            except Exception as e:
                self.logger.warning(f"Error processing chunk {i+1}: {str(e)}")
                continue
            finally:
                if chunk_file_path and os.path.exists(chunk_file_path):
                    try:
                        os.unlink(chunk_file_path)
                    except:
                        pass

        return full_transcript.strip()

    def transcribe_audio(self, audio_path, language_code="en-IN"):
        """Enhanced audio transcription with speaker diarization and chunking support"""
        try:
            audio_segment = AudioSegment.from_file(audio_path)
            duration_seconds = len(audio_segment) / 1000

            # Use chunking for long audio files
            if duration_seconds > 59:
                full_transcript = self.transcribe_audio_chunks(
                    audio_path, language_code, audio_segment
                )
                return {
                    "transcriptions": [
                        {"transcript": full_transcript, "confidence": 0.9}
                    ],
                    "detected_language": language_code,
                    "full_transcript": full_transcript,
                    "duration_seconds": duration_seconds,
                    "processing_method": "chunked",
                }

            # Process short audio files normally
            with open(audio_path, "rb") as f:
                content = f.read()

            audio = speech_v1.RecognitionAudio(content=content)
            config = self.get_recognition_config(language_code, show_info=True)
            response = self.client.recognize(config=config, audio=audio)

            transcript = self.process_diarized_response(response)

            # Calculate average confidence
            avg_confidence = 0.0
            word_count = 0
            for result in response.results:
                for word_info in result.alternatives[0].words:
                    avg_confidence += (
                        word_info.confidence
                        if hasattr(word_info, "confidence")
                        else 0.9
                    )
                    word_count += 1

            if word_count > 0:
                avg_confidence = avg_confidence / word_count
            else:
                avg_confidence = 0.9

            return {
                "transcriptions": [
                    {"transcript": transcript, "confidence": avg_confidence}
                ],
                "detected_language": language_code,
                "full_transcript": transcript,
                "duration_seconds": duration_seconds,
                "processing_method": "standard",
            }

        except Exception as e:
            self.logger.error(f"Enhanced speech transcription failed: {str(e)}")
            return {"error": str(e)}
