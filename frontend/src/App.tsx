import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AudioRecorder from './components/AudioRecorder';
import AssetsService from './services/AssetsService';
import SignWritingDisplay from './components/SignWritingDisplay';
import SignWritingService from './services/SignWritingService';
import PoseViewer from './components/PoseViewer';
import './index.css';

function App() {
  const [transcription, setTranscription] = useState('');
  const [displayText, setDisplayText] = useState('');
  const [simplifyText, setSimplifyText] = useState(false);
  const [signWriting, setSignWriting] = useState<string[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [poseFile, setPoseFile] = useState<Blob | null>(null);
  const [isGeneratingPose, setIsGeneratingPose] = useState(false);

  useEffect(() => {
    const loadInitialAssets = async () => {
      const glbUri = await AssetsService.getFileUri('3d/character.glb');
      const usdzUri = await AssetsService.getFileUri('3d/character.usdz');
      console.log('Loaded 3D assets:', { glbUri, usdzUri });
      await SignWritingService.loadFonts();
      console.log('SignWriting fonts loaded.');
    };
    loadInitialAssets();
  }, []);

  const handleRecordingComplete = async (audioBlob: Blob) => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    const newAudioUrl = URL.createObjectURL(audioBlob);
    setAudioUrl(newAudioUrl);
    setTranscription('');
    setDisplayText('');
    setSignWriting([]);
    setPoseFile(null);

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
      setDisplayText(textToTranslate);

      // 3. Translate to SignWriting
      if (textToTranslate) {
        const translateResponse = await axios.post<{ signwriting: string }>(
          'http://127.0.0.1:8000/translate_signwriting',
          { text: textToTranslate }
        );
        const rawFsw = translateResponse.data.signwriting || '';
        const fswTokens = rawFsw.trim().split(/\s+/).filter(token => token.length > 0);
        setSignWriting(fswTokens);

        // 4. Generate pose file for animation (Online)
        setIsGeneratingPose(true);
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
            // Convert base64 to Blob
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
        } catch (poseError) {
          console.error('Error generating pose file:', poseError);
          setPoseFile(null);
        } finally {
          setIsGeneratingPose(false);
        }
      } else {
        setSignWriting([]);
        setPoseFile(null);
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      setTranscription('');
      setDisplayText('');
      setSignWriting([]);
      setPoseFile(null);
      setIsGeneratingPose(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
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

      <div className="mt-6">
        <h2 className="text-xl font-semibold">2D Skeleton Animation (Online):</h2>
        {isGeneratingPose && (
          <div className="text-blue-600 mb-4">Generating pose file...</div>
        )}
        {poseFile && (
          <PoseViewer 
            poseFile={poseFile}
            onAnimationComplete={() => console.log('Animation completed')}
          />
        )}
        {!isGeneratingPose && !poseFile && (
          <div className="text-gray-500 italic">No pose file available. Record audio to generate animation.</div>
        )}
      </div>
    </div>
  );
}

export default App;
