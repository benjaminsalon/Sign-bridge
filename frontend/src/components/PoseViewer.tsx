import React, { useEffect, useRef } from 'react';

interface PoseViewerProps {
  poseFile?: Blob | Uint8Array;
  poseUrl?: string;
  onAnimationComplete?: () => void;
}

const PoseViewer: React.FC<PoseViewerProps> = ({ poseFile, poseUrl, onAnimationComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [url, setUrl] = React.useState<string | null>(poseUrl || null);

  useEffect(() => {
    // Dynamically import and define the pose-viewer web component
    import('pose-viewer/loader').then(({ defineCustomElements }) => {
      defineCustomElements();
    });
  }, []);

  useEffect(() => {
    // If a poseFile is provided, create an object URL
    if (poseFile) {
      const blob = poseFile instanceof Blob ? poseFile : new Blob([poseFile], { type: 'application/octet-stream' });
      const objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else if (poseUrl) {
      setUrl(poseUrl);
    }
  }, [poseFile, poseUrl]);

  useEffect(() => {
    // Listen for animation complete event if needed
    const poseViewer = containerRef.current?.querySelector('pose-viewer');
    if (poseViewer && onAnimationComplete) {
      poseViewer.addEventListener('ended$', onAnimationComplete);
      return () => poseViewer.removeEventListener('ended$', onAnimationComplete);
    }
  }, [onAnimationComplete, url]);

  return (
    <div ref={containerRef} className="pose-viewer-container">
      {url ? (
        <pose-viewer
          src={url}
          autoplay
          aspect-ratio="1"
          style={{ width: 640, height: 480, border: '1px solid #ccc', display: 'block' }}
        />
      ) : (
        <div className="text-gray-500 italic">No pose file loaded.</div>
      )}
    </div>
  );
};

export default PoseViewer;
