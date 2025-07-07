import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import AudioRecorder from './components/AudioRecorder';
import SignWritingDisplay from './components/SignWritingDisplay';
import PoseViewer from './components/PoseViewer';
import LoadingSpinner from './components/LoadingSpinner';
import { useTheme } from './contexts/ThemeContext';
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

  const { theme, toggleTheme } = useTheme();
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
    <div className="min-h-screen transition-all duration-300">
      {/* Header */}
      <header className="glass border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient">
                  SignBridge
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Voice-to-Sign Translator</p>
              </div>
            </div>
            
            {/* Header Controls */}
            <div className="flex items-center gap-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? (
                  <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              
              {/* Simplify Text Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simplifyText}
                  onChange={(e) => setSimplifyText(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Simplify Text
                </span>
          </label>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" style={{height: 'calc(100vh - 140px)'}}>
          
          {/* Input Section - Larger */}
          <div className="xl:col-span-5 h-full">
            <div className="card h-full flex flex-col">
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Input Text
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Type or speak your message to translate
                </p>
              </div>
              <div className="flex-1 flex flex-col pt-4">
          <textarea
                  className="input flex-1 scrollable-container"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your message here or use voice recording..."
            aria-label="Input text for translation"
          />
                
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mt-4">
                  <button
                    onClick={handleRecordClick}
                    className="btn flex-1 btn-success"
                    aria-pressed={isRecording}
                    aria-label="Start recording"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                    Record
                  </button>
                  
                  <button
                    onClick={() => triggerTranslation(inputText)}
                    disabled={isTranslating || inputText.trim() === ''}
                    className="btn btn-primary"
                    aria-label="Translate text"
                  >
                    {isTranslating ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Translating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        Translate
                      </>
                    )}
            </button>
                </div>
              </div>
          </div>
        </div>

          {/* SignWriting Display - Smaller */}
          <div className="xl:col-span-3 h-full">
            <div className="card h-full flex flex-col">
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  SignWriting
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Visual notation
                </p>
              </div>
              <div className="flex-1 pt-4">
                {isTranslating ? (
                  <div className="h-full flex items-center justify-center">
                    <LoadingSpinner size="md" text="Translating..." />
                  </div>
                ) : (
                  <div className="h-full scrollable-container">
          <SignWritingDisplay fswTokens={signWriting} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Animation Section - Larger */}
          <div className="xl:col-span-4 h-full">
            <div className="card h-full flex flex-col">
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Animation
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Animated sign language
                </p>
              </div>
              <div className="flex-1 flex items-center justify-center pt-4">
                {isTranslating ? (
                  <LoadingSpinner size="lg" text="Generating animation..." />
                ) : poseFile ? (
                  <div className="w-full h-full flex items-center justify-center">
            <PoseViewer poseFile={poseFile} onAnimationComplete={() => {}} />
                  </div>
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm">No animation available</p>
                    <p className="text-xs mt-1">Translate text to see animation</p>
                  </div>
          )}
        </div>
      </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 animate-fade-in">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-800 dark:text-red-200 font-medium">{error}</span>
              </div>
            </div>
          </div>
        )}

        {/* Transcription Display */}
        {transcription && (
          <div className="mt-6 animate-fade-in">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-blue-800 dark:text-blue-200 font-medium mb-1">Transcription</p>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">{transcription}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Audio Recorder Component */}
      {isRecording && (
        <AudioRecorder
          onRecordingComplete={handleRecordComplete}
          recordingSource={recordingSource}
          setRecordingSource={setRecordingSource}
        />
      )}
    </div>
  );
}

export default App;