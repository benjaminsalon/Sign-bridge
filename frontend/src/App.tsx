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
  const [isTranscribing, setIsTranscribing] = useState(false);
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
    setIsTranscribing(true);
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
      setIsTranscribing(false);
      triggerTranslation(originalText);
    } catch {
      setError('Transcription failed. Please try again.');
      setIsTranscribing(false);
    }
  };

  const handleRecordClick = () => {
    setError(null);
    setIsRecording(!isRecording);
  };

  return (
    <div className="min-h-screen transition-all duration-300">
      {/* Enhanced Header */}
      <header className="glass border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Enhanced Branding */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  SignBridge
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">AI-Powered Voice-to-Sign Translator</p>
              </div>
            </div>
            
            {/* Enhanced Header Controls */}
            <div className="flex items-center gap-6">
              {/* Simplify Text Toggle - Enhanced */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={simplifyText}
                    onChange={(e) => setSimplifyText(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors duration-200 flex items-center ${
                    simplifyText ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                      simplifyText ? 'translate-x-5' : 'translate-x-0'
                    }`}></div>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Simplify Text
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Optimize for translation</span>
                </div>
              </label>
              
              {/* Enhanced Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="relative p-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 group shadow-sm hover:shadow-md"
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? (
                  <svg className="w-5 h-5 text-gray-700 group-hover:text-purple-600 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-300 group-hover:text-yellow-400 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                )}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-200"></div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8" style={{height: 'calc(100vh - 160px)'}}>
          
          {/* Input Section - Enhanced */}
          <div className="xl:col-span-5 h-full">
            <div className="card h-full flex flex-col shadow-xl hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
              <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Input Text
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Type or speak your message to translate
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col pt-6">
                {isTranscribing ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Processing voice recording...</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Converting speech to text</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative flex-1">
                    <textarea
                      className="w-full h-full resize-none bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 transition-all duration-200 text-base leading-relaxed"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Type your message here or use voice recording to get started..."
                      aria-label="Input text for translation"
                    />
                    <div className="absolute bottom-4 right-4 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                      <span>{inputText.length} characters</span>
                      <div className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                      <span>Press Enter to translate</span>
                    </div>
                  </div>
                )}
                
                {/* Enhanced Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                  <button
                    onClick={handleRecordClick}
                    className="group relative flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    aria-pressed={isRecording}
                    aria-label="Start recording"
                    disabled={isRecording || isTranscribing}
                  >
                    <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    <div className="relative flex items-center justify-center gap-3">
                      <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>{isRecording ? 'Recording...' : 'Record Voice'}</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => triggerTranslation(inputText)}
                    disabled={isTranslating || isTranscribing || inputText.trim() === ''}
                    className="group relative flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    aria-label="Translate text"
                  >
                    <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    <div className="relative flex items-center justify-center gap-3">
                      {isTranslating ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Translating...</span>
                        </>
                      ) : (
                        <>
                          <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </div>
                          <span>Translate</span>
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SignWriting Display - Enhanced */}
          <div className="xl:col-span-3 h-full">
            <div className="card h-full flex flex-col shadow-xl hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
              <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      SignWriting
                    </h2>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Visual notation system
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 pt-6">
                {/* Status and counter - positioned outside scrollable area, always visible */}
                <div className="flex items-center justify-between mb-4 px-2">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {isTranslating ? 'Processing...' : `${signWriting.length} sign${signWriting.length !== 1 ? 's' : ''}`}
                  </span>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${isTranslating ? 'bg-orange-500 animate-pulse' : signWriting.length > 0 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {isTranslating ? 'Loading' : signWriting.length > 0 ? 'Ready' : 'Empty'}
                    </span>
                  </div>
                </div>
                
                {isTranslating ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-purple-200 dark:border-purple-800 border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Processing signs...</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col">
                    <div className="flex-1 scrollable-container">
                      <SignWritingDisplay fswTokens={signWriting} />
                    </div>
                    {/* Footer with instructions - only show when there are signs */}
                    {signWriting.length > 0 && (
                      <div className="mt-4 px-2">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Hover for details • Scroll for more
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Animation Section - Enhanced */}
          <div className="xl:col-span-4 h-full">
            <div className="card h-full flex flex-col shadow-xl hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
              <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Animation
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Sign language animation
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 pt-6">
                {/* Status bar - show when no animation or when translating */}
                {(!poseFile || isTranslating) && (
                  <div className="flex items-center justify-between mb-4 px-2">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Animation
                    </span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isTranslating ? 'bg-orange-500 animate-pulse' : 'bg-gray-400'}`}></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {isTranslating ? 'Loading' : 'Empty'}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-center h-full">
                  {isTranslating ? (
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Generating animation...</p>
                    </div>
                  ) : poseFile ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <PoseViewer poseFile={poseFile} onAnimationComplete={() => {}} isTranslating={isTranslating} />
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium mb-1">No animation available</p>
                      <p className="text-xs">Translate text to see 3D animation</p>
                    </div>
                  )}
                </div>
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
          onClose={() => setIsRecording(false)}
        />
      )}
    </div>
  );
}

export default App;