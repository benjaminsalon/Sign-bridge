import React, { useEffect, useState } from 'react';
import SignWritingService from '../services/SignWritingService';



interface SignWritingDisplayProps {
  fswTokens: string[];
}

const SignWritingDisplay: React.FC<SignWritingDisplayProps> = ({ fswTokens }) => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [normalizedTokens, setNormalizedTokens] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        setLoading(true);
        await SignWritingService.loadFonts();
        setFontsLoaded(true);
      } catch (error) {
        console.error('Failed to load SignWriting fonts:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFonts();
  }, []);

  useEffect(() => {
    const normalizeTokens = async () => {
      if (!fontsLoaded) return;
      
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
  }, [fswTokens, fontsLoaded]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-4 bg-blue-100 dark:bg-blue-900/20 rounded-full">
            <svg className="w-6 h-6 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Loading SignWriting fonts...
          </p>
        </div>
      </div>
    );
  }

  if (!fontsLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-4 bg-red-100 dark:bg-red-900/20 rounded-full">
            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-2">
            Font Loading Failed
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Please refresh the page to try again
          </p>
        </div>
      </div>
    );
  }

  if (normalizedTokens.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gray-100 dark:bg-gray-800 rounded-full">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">
            No Signs to Display
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Enter text and translate to see SignWriting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with count */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {normalizedTokens.length} sign{normalizedTokens.length !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Ready</span>
        </div>
      </div>

      {/* Signs Container */}
      <div className="flex-1">
        <div
          id="signwriting-container"
          className="flex flex-col items-center space-y-4 p-2"
          style={{
            fontSize: '24px',
            color: 'black',
          }}
        >
          {normalizedTokens.map((token, index) => (
            <div
              key={index}
              className="group relative"
              style={{
                animation: `fadeIn 0.3s ease-out ${index * 0.1}s both`
              }}
            >
              <div
                dangerouslySetInnerHTML={{
                  __html: `<fsw-sign sign="${token}" style="direction: ltr; display: block; user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; -webkit-touch-callout: none; color: white; fill: white; filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1)); transition: transform 0.2s ease-in-out;" class="hover:scale-105 cursor-pointer"></fsw-sign>`
                }}
              />
              
              {/* Hover tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Sign {index + 1}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer with instructions */}
      <div className="mt-2 px-1">
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Hover for details • Scroll for more
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default SignWritingDisplay;
