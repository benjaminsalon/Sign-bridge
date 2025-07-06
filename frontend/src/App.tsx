import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AudioRecorder from './components/AudioRecorder';
import AssetsService from './services/AssetsService';
import SignWritingDisplay from './components/SignWritingDisplay';
import SignWritingService from './services/SignWritingService';
import './index.css';

function App() {
  const [transcription, setTranscription] = useState('');
  const [displayText, setDisplayText] = useState(''); // Text sent for translation
  const [simplifyText, setSimplifyText] = useState(false);
  const [signWriting, setSignWriting] = useState<string[]>([]);
  const [animationTracks, setAnimationTracks] = useState<Record<string, number[][]>>({});
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    // Load all necessary assets and fonts on initial component mount
    const loadInitialAssets = async () => {
      // Load 3D character assets
      const glbUri = await AssetsService.getFileUri('3d/character.glb');
      const usdzUri = await AssetsService.getFileUri('3d/character.usdz');
      console.log('Loaded 3D assets:', { glbUri, usdzUri });

      // Load the SignWriting fonts. This is crucial for display.
      await SignWritingService.loadFonts();
      console.log('SignWriting fonts loaded.');
    };

    loadInitialAssets();
  }, []); // Empty dependency array ensures this runs only once

  const parseAnimationTracks = (fswTokens: string[]): Record<string, number[][]> => {
    console.log('Parsing animation tracks for:', fswTokens);
    // TODO: Implement actual parsing logic based on signWriting notation format
    return {};
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    const newAudioUrl = URL.createObjectURL(audioBlob);
    setAudioUrl(newAudioUrl);

    // Reset states for new request
    setTranscription('');
    setDisplayText('');
    setSignWriting([]);
    setAnimationTracks({});

    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    try {
      // 1. Transcribe audio
      const transcribeResponse = await axios.post<{ text: string }>(
        'http://127.0.0.1:8000/transcribe',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      const originalText = transcribeResponse.data.text || '';
      setTranscription(originalText);

      let textToTranslate = originalText;

      // 2. Optionally simplify text
      if (simplifyText && originalText) {
        const simplifyResponse = await axios.post<{ simplified_text: string }>(
          'http://127.0.0.1:8000/simplify_text',
          { text: originalText }
        );
        textToTranslate = simplifyResponse.data.simplified_text || originalText;
      }
      setDisplayText(textToTranslate); // Set the text that will be translated

      // 3. Translate to SignWriting
      if (textToTranslate) {
        const translateResponse = await axios.post<{ signwriting: string }>(
          'http://127.0.0.1:8000/translate_signwriting',
          { text: textToTranslate }
        );
        console.log(translateResponse)
        const rawFsw = translateResponse.data.signwriting || '';
        const fswTokens = rawFsw.trim().split(/\s+/).filter(token => token.length > 0);

        //normalize the fsw here if needed

        setSignWriting(fswTokens)

        // FIX: Use the newly calculated 'normalizedTokens' directly,
        // not the 'signWriting' state variable which has not updated yet.
        // The setTimeout hack is no longer needed.
        const parsedTracks = parseAnimationTracks(fswTokens);
        setAnimationTracks(parsedTracks);

      } else {
        setSignWriting([]);
        setAnimationTracks({});
      }

    } catch (error) {
      console.error('Error processing audio:', error);
      // Ensure state is cleared on error
      setTranscription('');
      setDisplayText('');
      setSignWriting([]);
      setAnimationTracks({});
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
      {/* ... rest of your JSX is fine ... */}
      <h1 className="text-3xl font-bold mb-4">SignBridge: Voice-to-Sign Translator</h1>
      <AudioRecorder onRecordingComplete={handleRecordingComplete} />

      {audioUrl && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold">Recorded Audio Playback:</h2>
          <audio controls src={audioUrl} />
        </div>
      )}

      <label className="ml-4">
        <input
          type="checkbox"
          checked={simplifyText}
          onChange={() => setSimplifyText(!simplifyText)}
          className="mr-2"
        />
        Simplify Text (requires Internet)
      </label>

      <div className="mt-6">
        <h2 className="text-xl font-semibold">Transcription (Original):</h2>
        <p className="whitespace-pre-wrap">{transcription}</p>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold">Text for Translation:</h2>
        <p className="whitespace-pre-wrap">{displayText}</p>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold">SignWriting Notation (FSW):</h2>
        <pre className="bg-gray-200 dark:bg-gray-800 p-4 rounded overflow-x-auto">
          {signWriting.join(' ')}
        </pre>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold">SignWriting Visual:</h2>
        <SignWritingDisplay fswTokens={signWriting} />
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold">SignWriting Animation:</h2>
        {/* Show the animation video here */}
      </div>
    </div>
  );
}

export default App;
