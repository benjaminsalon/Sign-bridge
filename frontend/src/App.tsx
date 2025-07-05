import React, { useState } from 'react';
import axios from 'axios';
import AnimationComponent from './components/animation/AnimationComponent';
import AudioRecorder from './components/AudioRecorder';
import './index.css';

function App() {
  const [transcription, setTranscription] = useState('');
  const [simplifyText, setSimplifyText] = useState(false);
  const [signWriting, setSignWriting] = useState('');
  const [animationTracks, setAnimationTracks] = useState<Record<string, number[][]>>({});
  const [displayText, setDisplayText] = useState(''); // New state for English text display
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleRecordingComplete = async (audioBlob: Blob) => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    const newAudioUrl = URL.createObjectURL(audioBlob);
    setAudioUrl(newAudioUrl);
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

      try {
        // Transcribe audio
        const transcribeResponse = await axios.post<{ text: string }>('http://127.0.0.1:8000/transcribe', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        let text = transcribeResponse.data.text;
        if (!text) {
          text = '';
        }
        setTranscription(text);
        setDisplayText(text); // Update display text with original transcription

        // Optionally simplify text
        if (simplifyText) {
          const simplifyResponse = await axios.post<{ simplified_text: string }>('http://127.0.0.1:8000/simplify_text', { text });
          text = simplifyResponse.data.simplified_text || '';
          setTranscription(text);
          setDisplayText(text); // Update display text with simplified text
        }

        // Translate to SignWriting
        if (text) {
          const translateResponse = await axios.post<{ signwriting: string }>('http://127.0.0.1:8000/translate_signwriting', { text });
          setSignWriting(translateResponse.data.signwriting || '');
        } else {
          setSignWriting('');
        }

      // Reset animationTracks to force update
      setAnimationTracks({});
      // TODO: Parse animation tracks from signWriting data and update animationTracks state
      setTimeout(() => {
        setAnimationTracks({}); // Replace with actual parsed tracks
      }, 100);

    } catch (error) {
      console.error('Error processing audio:', error);
      setTranscription('');
      setDisplayText('');
      setSignWriting('');
      setAnimationTracks({});
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
        <h2 className="text-xl font-semibold">Transcription:</h2>
        <p className="whitespace-pre-wrap">{transcription}</p>
      </div>
      <div className="mt-6">
        <h2 className="text-xl font-semibold">English Text:</h2>
        <p className="whitespace-pre-wrap">{displayText}</p>
      </div>
      <div className="mt-6">
        <h2 className="text-xl font-semibold">SignWriting Animation:</h2>
        <pre className="bg-gray-200 dark:bg-gray-800 p-4 rounded overflow-x-auto">{signWriting}</pre>
        <AnimationComponent animationTracks={animationTracks} fps={30} />
      </div>
    </div>
  );
}

export default App;
