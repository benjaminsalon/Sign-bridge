import React, { useEffect, useRef, useState } from 'react';
import { AnimationService } from '../services/AnimationService';
import type { PoseData } from '../services/AnimationService';
import { PoseDataConverter } from '../utils/PoseDataConverter';
import { VideoEncoderService } from '../services/VideoEncoderService';

interface SkeletonAnimationProps {
  poseData: PoseData[];
  onAnimationComplete?: () => void;
}

const SkeletonAnimation: React.FC<SkeletonAnimationProps> = ({
  poseData,
  onAnimationComplete
}) => {
  const poseViewerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [videoEncoder, setVideoEncoder] = useState<VideoEncoderService | null>(null);

  const width = 640;
  const height = 480;
  const fps = 30;

  // Initialize pose-viewer
  useEffect(() => {
    const initPoseViewer = async () => {
      try {
        // Dynamically import pose-viewer
        const { defineCustomElements } = await import('pose-viewer/loader');
        await defineCustomElements();
        
        // Create pose-viewer element
        const poseViewer = document.createElement('pose-viewer');
        poseViewer.setAttribute('autoplay', 'true');
        poseViewer.setAttribute('aspect-ratio', '1');
        poseViewer.setAttribute('width', '100%');
        poseViewer.style.width = `${width}px`;
        poseViewer.style.height = `${height}px`;
        poseViewer.style.border = '1px solid #ccc';
        
        // Convert pose data to pose-viewer format
        if (poseData.length > 0) {
          const poseBlob = await convertPoseDataToBlob(poseData);
          const poseUrl = URL.createObjectURL(poseBlob);
          poseViewer.setAttribute('src', poseUrl);
          
          poseViewerRef.current = poseViewer;
          
          // Add event listeners
          poseViewer.addEventListener('firstRender$', () => {
            console.log('Pose viewer first render');
            startVideoRecording();
          });
          
          poseViewer.addEventListener('ended$', () => {
            console.log('Pose viewer ended');
            stopVideoRecording();
            onAnimationComplete?.();
          });
          
          // Replace canvas with pose-viewer
          const container = document.querySelector('.skeleton-animation-container');
          if (container) {
            const canvas = container.querySelector('canvas');
            if (canvas) {
              canvas.parentNode?.replaceChild(poseViewer, canvas);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing pose-viewer:', error);
        // Fallback to canvas rendering
        renderCanvasFallback();
      }
    };

    initPoseViewer();
  }, [poseData]);

  // Convert pose data to pose-viewer compatible format
  const convertPoseDataToBlob = async (poses: PoseData[]): Promise<Blob> => {
    // Try different pose file formats to see which one works with pose-viewer
    try {
      // First try the simple pose file format
      return PoseDataConverter.createSimplePoseFile(poses, fps);
    } catch (error) {
      console.error('Error creating pose file:', error);
      // Fallback to JSON format
      return PoseDataConverter.convertToJsonFormat(poses, fps);
    }
  };

  // Video recording functionality with WebCodecs support
  const startVideoRecording = async () => {
    if (!poseViewerRef.current) return;
    
    try {
      setIsRecording(true);
      
      // Get the canvas from pose-viewer shadow DOM
      const poseViewer = poseViewerRef.current;
      const canvas = poseViewer.shadowRoot?.querySelector('canvas');
      
      if (canvas) {
        // Try WebCodecs first, fallback to MediaRecorder
        if (VideoEncoderService.isSupported()) {
          await startWebCodecsRecording(canvas);
        } else {
          await startMediaRecorderRecording(canvas);
        }
      }
    } catch (error) {
      console.error('Error recording video:', error);
      setIsRecording(false);
    }
  };

  const startWebCodecsRecording = async (canvas: HTMLCanvasElement) => {
    try {
      // Create ImageBitmap from canvas
      const imageBitmap = await createImageBitmap(canvas);
      const encoder = new VideoEncoderService(imageBitmap, fps);
      await encoder.init();
      
      setVideoEncoder(encoder);
      
      // Start capturing frames
      const duration = (poseData.length / fps) * 1000;
      const frameInterval = 1000 / fps;
      
      for (let i = 0; i < poseData.length; i++) {
        setTimeout(async () => {
          if (encoder) {
            const frameBitmap = await createImageBitmap(canvas);
            encoder.addFrame(i, frameBitmap);
          }
        }, i * frameInterval);
      }
      
      // Finalize after animation duration
      setTimeout(async () => {
        if (encoder) {
          const blob = await encoder.finalize();
          const url = URL.createObjectURL(blob);
          setVideoUrl(url);
          setIsVideoReady(true);
          setIsRecording(false);
          encoder.close();
        }
      }, duration);
      
    } catch (error) {
      console.error('WebCodecs recording failed, falling back to MediaRecorder:', error);
      await startMediaRecorderRecording(canvas);
    }
  };

  const startMediaRecorderRecording = async (canvas: HTMLCanvasElement) => {
    const stream = canvas.captureStream(fps);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm; codecs=vp9'
    });
    
    const chunks: Blob[] = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setIsVideoReady(true);
      setIsRecording(false);
    };
    
    // Start recording
    mediaRecorder.start();
    
    // Stop recording after animation duration
    const duration = (poseData.length / fps) * 1000;
    setTimeout(() => {
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    }, duration);
  };

  const stopVideoRecording = () => {
    setIsRecording(false);
    if (videoEncoder) {
      videoEncoder.close();
      setVideoEncoder(null);
    }
  };

  // Canvas fallback rendering
  const renderCanvasFallback = () => {
    const canvas = document.querySelector('.skeleton-animation-container canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx || poseData.length === 0) return;

    // Draw the first frame as fallback
    drawSkeleton(ctx, poseData[0]);
  };

  const drawSkeleton = (ctx: CanvasRenderingContext2D, pose: PoseData) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    if (pose.poseLandmarks && pose.poseLandmarks.length >= 23) {
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 2;
      
      // Only upper body, face, arms (no legs/feet)
      const connections = [
        // Face (optional, for head/neck)
        [0, 1], [1, 2], [2, 3], [3, 7], // Left eye to left ear
        [0, 4], [4, 5], [5, 6], [6, 8], // Right eye to right ear
        [9, 10], // Mouth

        // Shoulders and arms
        [11, 12], // Shoulders
        [11, 13], [13, 15], // Left arm
        [12, 14], [14, 16], // Right arm

        // Shoulders to neck (optional)
        [0, 11], [0, 12],

        // Wrists to fingers (keep for hand base)
        [15, 17], [15, 19], [15, 21], // Left wrist to fingers
        [16, 18], [16, 20], [16, 22], // Right wrist to fingers
      ];

      connections.forEach(([start, end]) => {
        if (pose.poseLandmarks[start] && pose.poseLandmarks[end] && 
            pose.poseLandmarks[start].x !== 0 && pose.poseLandmarks[start].y !== 0 &&
            pose.poseLandmarks[end].x !== 0 && pose.poseLandmarks[end].y !== 0) {
          ctx.beginPath();
          ctx.moveTo(pose.poseLandmarks[start].x * width, pose.poseLandmarks[start].y * height);
          ctx.lineTo(pose.poseLandmarks[end].x * width, pose.poseLandmarks[end].y * height);
          ctx.stroke();
        }
      });
      
      // Draw joints (only for upper body: 0-22)
      ctx.fillStyle = '#FF0000';
      pose.poseLandmarks.forEach((landmark, i) => {
        if (i <= 22 && (landmark.x !== 0 || landmark.y !== 0)) {
          ctx.beginPath();
          ctx.arc(landmark.x * width, landmark.y * height, 3, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
    }

    // Draw hands
    if (pose.leftHandLandmarks) {
      drawHand(ctx, pose.leftHandLandmarks, '#FF0000');
    }
    if (pose.rightHandLandmarks) {
      drawHand(ctx, pose.rightHandLandmarks, '#00FF00');
    }
  };

  const drawHand = (
    ctx: CanvasRenderingContext2D, 
    landmarks: Array<{x: number, y: number, z: number}>, 
    color: string
  ) => {
    if (!landmarks || landmarks.length < 21) return;

    const handConnections = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [0,9],[9,10],[10,11],[11,12],
      [0,13],[13,14],[14,15],[15,16],
      [0,17],[17,18],[18,19],[19,20]
    ];

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    handConnections.forEach(([start, end]) => {
      if (landmarks[start] && landmarks[end] && 
          landmarks[start].x !== 0 && landmarks[start].y !== 0 &&
          landmarks[end].x !== 0 && landmarks[end].y !== 0) {
        ctx.beginPath();
        ctx.moveTo(landmarks[start].x * width, landmarks[start].y * height);
        ctx.lineTo(landmarks[end].x * width, landmarks[end].y * height);
        ctx.stroke();
      }
    });

    ctx.fillStyle = color;
    landmarks.forEach(landmark => {
      if (landmark.x !== 0 || landmark.y !== 0) {
        ctx.beginPath();
        ctx.arc(landmark.x * width, landmark.y * height, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  };

  useEffect(() => {
    AnimationService.getInstance().initialize();
  }, []);

  return (
    <div className="skeleton-animation-container">
      {!isVideoReady ? (
        <canvas
          width={width}
          height={height}
          style={{
            border: '1px solid #ccc',
            maxWidth: '100%',
            height: 'auto'
          }}
        />
      ) : (
        <video
          src={videoUrl || ''}
          autoPlay
          loop
          muted
          playsInline
          style={{
            width: '100%',
            height: 'auto',
            border: '1px solid #ccc'
          }}
        />
      )}
      
      <div className="animation-controls mt-4">
        {isRecording && (
          <div className="text-blue-600 mb-2">
            Recording animation... {VideoEncoderService.isSupported() ? '(WebCodecs)' : '(MediaRecorder)'}
          </div>
        )}
        {isVideoReady && (
          <div className="text-green-600 mb-2">✅ Animation ready!</div>
        )}
        <span className="text-sm text-theme-secondary">
          Frames: {poseData.length} | FPS: {fps}
        </span>
      </div>
    </div>
  );
};

export default SkeletonAnimation; 