'use client';
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export default function VoiceRecorder({ onTranscript, disabled }) {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      // Check browser support for different MIME types
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Check if recording is too short
        if (recordingTime < 1) {
          alert(t('Recording too short. Please speak for at least 1 second.'));
          setRecordingTime(0);
          return;
        }
        
        // Send to backend for transcription
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log('🎤 Recording started with MIME type:', mimeType);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      if (error.name === 'NotAllowedError') {
        alert(t('Microphone access denied. Please enable microphone permissions in your browser settings.'));
      } else if (error.name === 'NotFoundError') {
        alert(t('No microphone found. Please connect a microphone and try again.'));
      } else {
        alert(t('Failed to access microphone: ') + error.message);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const transcribeAudio = async (audioBlob) => {
    try {
      console.log('📤 Sending audio for transcription, size:', audioBlob.size, 'bytes');
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('📥 Transcription response:', data);

      if (data.success && data.transcript) {
        onTranscript(data.transcript);
      } else {
        alert(t('Failed to transcribe audio: ') + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Transcription error:', error);
      alert(t('Failed to transcribe audio. Please check your internet connection and try again.'));
    } finally {
      setIsProcessing(false);
      setRecordingTime(0);
    }
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      {/* Recording timer */}
      {isRecording && (
        <span className="text-xs text-red-600 font-mono font-semibold animate-pulse">
          {formatTime(recordingTime)}
        </span>
      )}
      
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isProcessing}
        className={`p-2 rounded-lg transition-all duration-200 ${
          isRecording
            ? 'bg-red-500 text-white animate-pulse hover:bg-red-600'
            : isProcessing
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
            : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={
          isRecording
            ? t('Stop recording')
            : isProcessing
            ? t('Processing...')
            : t('Record voice message')
        }
      >
        {isProcessing ? (
          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        ) : isRecording ? (
          // Stop icon (square)
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          // Microphone icon
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}