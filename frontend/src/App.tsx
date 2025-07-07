import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import AudioRecorder from './components/AudioRecorder';
import SignWritingDisplay from './components/SignWritingDisplay';
import PoseViewer from './components/PoseViewer';
import './index.css';

function App() {
  const [inputText, setInputText] = useState('');
  const [transcription, setTranscription] = useState('');
  const [simplifyText, setSimplifyText] = useState(false);
  const [signWriting, setSignWriting] = useState<string[]>([]);
  const [poseFile, setPoseFile] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingSource, setRecordingSource] = useState<'mic' | 'system'>('mic');

  const translationTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (translationTimeout.current) {
      clearTimeout(translationTimeout.current);
    }
    if (inputText.trim() === '') {
      setSignWriting([]);
      setPoseFile(null);
      setTranscription('');
      return;
    }
    translationTimeout.current = setTimeout(() => {
      if (/[.!?\n]$/.test(inputText.trim())) {
        triggerTranslation(inputText);
      }
    }, 1500);
  }, [inputText]);

  const triggerTranslation = async (text: string) => {
    setIsTranslating(true);
    setError(null);
    setTranscription(text);
    try {
      let textToTranslate = text;
      if (simplifyText) {
        const simplifyResponse = await axios.post<{ simplified_text: string }>(
          'http://127.0.0.1:8000/simplify_text',
          { text }
        );
        textToTranslate = simplifyResponse.data.simplified_text || text;
      }
      const translateResponse = await axios.post<{ signwriting: string }>(
        'http://127.0.0.1:8000/translate_signwriting',
        { text: textToTranslate }
      );
      const rawFsw = translateResponse.data.signwriting || '';
      const fswTokens = rawFsw.trim().split(/\s+/).filter(token => token.length > 0);
      setSignWriting(fswTokens);

      try {
        const poseResponse = await axios.post<{ pose_data: string; data_format: string }>(
          'http://127.0.0.1:8000/generate_pose',
          {
            text: textToTranslate,
            spoken_language: 'en',
            signed_language: 'ase',
          },
          { responseType: 'json' }
        );
        const { pose_data, data_format } = poseResponse.data;
        if (data_format === 'binary_base64' && pose_data) {
          const binary = atob(pose_data);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'application/octet-stream' });
          setPoseFile(blob);
        } else {
          setPoseFile(null);
        }
      } catch {
        setPoseFile(null);
      }
    } catch {
      setError('Translation failed. Please try again.');
      setSignWriting([]);
      setPoseFile(null);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleRecordComplete = async (audioBlob: Blob) => {
    setIsRecording(false);
    setError(null);
    setInputText('');
    setSignWriting([]);
    setPoseFile(null);
    setTranscription('');
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      const transcribeResponse = await axios.post<{ text: string }>(
        'http://127.0.0.1:8000/transcribe',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      const originalText = transcribeResponse.data.text || '';
      setInputText(originalText);
      triggerTranslation(originalText);
    } catch {
      setError('Transcription failed. Please try again.');
    }
  };

  const handleRecordClick = () => {
    setError(null);
    setIsRecording(!isRecording);
  };

  return (
    <div className="min-h-screen p-4 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
      <h1 className="text-3xl font-bold mb-4 text-center">SignBridge: Voice-to-Sign Translator</h1>
      <div className="flex flex-1 gap-4 flex-row">
        {/* Text Input Column */}
        <div className="flex flex-col w-2/5">
          <label htmlFor="textInput" className="mb-2 font-semibold">
            Input Text (Type or from Speech)
          </label>
          <textarea
            id="textInput"
            className="flex-grow p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={15}
            aria-label="Input text for translation"
          />
          <div className="mt-2 flex items-center gap-4">
            <button
              onClick={handleRecordClick}
              className={`px-4 py-2 rounded ${
                isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              } text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
              aria-pressed={isRecording}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            >
              {isRecording ? 'Stop Recording' : 'Record Mic'}
            </button>
            <button
              onClick={() => setRecordingSource('system')}
              className={`px-4 py-2 rounded ${
                recordingSource === 'system' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'
              } text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              aria-pressed={recordingSource === 'system'}
              aria-label="Record system audio (UI only)"
              disabled
              title="System audio recording not yet implemented"
            >
              Record System Audio
            </button>
            <button
              onClick={() => triggerTranslation(inputText)}
              disabled={isTranslating || inputText.trim() === ''}
              className="px-4 py-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400"
              aria-label="Translate text"
            >
              &#8594; Translate
            </button>
          </div>
        </div>

        {/* SignWriting Bar (Vertical) */}
        <div
          className="w-2/5 overflow-y-auto border-l border-r border-gray-300 dark:border-gray-700 px-2 flex flex-col items-center"
          style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}
          aria-label="SignWriting notation display"
          tabIndex={0}
        >
          <SignWritingDisplay fswTokens={signWriting} />
        </div>

        {/* Animation Display */}
        <div className="w-1/5 flex flex-col items-center justify-center border border-gray-300 dark:border-gray-700 rounded p-2">
          <h2 className="mb-2 font-semibold">Animation</h2>
          {poseFile ? (
            <PoseViewer poseFile={poseFile} onAnimationComplete={() => {}} />
          ) : (
            <div className="text-gray-500 italic">No animation available</div>
          )}
        </div>
      </div>

      {isRecording && (
        <AudioRecorder
          onRecordingComplete={handleRecordComplete}
        />
      )}
    </div>
  );
}

export default App;