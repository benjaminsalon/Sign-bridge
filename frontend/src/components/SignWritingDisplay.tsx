import React, { useEffect, useState } from 'react';
import SignWritingService from '../services/SignWritingService';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'fsw-sign': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { sign: string };
    }
  }
}

interface SignWritingDisplayProps {
  fswTokens: string[];
}

const SignWritingDisplay: React.FC<SignWritingDisplayProps> = ({ fswTokens }) => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [normalizedTokens, setNormalizedTokens] = useState<string[]>([]);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        await SignWritingService.loadFonts();
        setFontsLoaded(true);
      } catch (error) {
        console.error('Failed to load SignWriting fonts:', error);
      }
    };
    loadFonts();
  }, []);

  useEffect(() => {
    const normalizeTokens = async () => {
      const results = [];
      for (const token of fswTokens) {
        const normalized = await SignWritingService.normalizeFSW(token);
        if (normalized) {
          results.push(normalized);
        } else {
          results.push(token);
        }
      }
      setNormalizedTokens(results);
    };
    normalizeTokens();
  }, [fswTokens]);

  if (!fontsLoaded) {
    return <div>Loading SignWriting fonts...</div>;
  }

  return (
    <div
      id="signwriting-container"
      style={{
        display: 'flex',
        flexDirection: 'column', // vertical layout (Y direction)
        alignItems: 'center',
        overflowY: 'auto',
        maxHeight: '80vh', // limit height to viewport height for scrolling
        width: '100%',
        padding: '20px 0',
        fontSize: '24px',
        color: 'black',
      }}
    >
      {normalizedTokens.map((token, index) => (
        <fsw-sign
          key={index}
          sign={token}
          style={{
            direction: 'ltr',
            display: 'block',
            margin: '20px 0',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            WebkitTouchCallout: 'none',
            color: 'white',
            fill: 'white',
          }}
        />
      ))}
    </div>
  );
};

export default SignWritingDisplay;
