# Phase 6: 2D Skeleton Animation Integration

## Overview
This document outlines the implementation plan for integrating 2D skeleton animation into the SignBridge project. The animation system will convert SignWriting notation into animated 2D skeleton poses, providing a visual representation of sign language gestures.

## Architecture Analysis

### Current Translate Project Animation System
The translate project uses a sophisticated animation pipeline with the following components:

1. **Pose Generation API**: `https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_pose`
2. **TensorFlow.js Animation Model**: Custom model for pose-to-animation conversion
3. **Pose-viewer Library**: 2D skeleton visualization
4. **WebCodecs API**: Video encoding for final output

### Key Technologies Identified
- **Pose-viewer**: `pose-viewer` npm package for 2D skeleton rendering
- **TensorFlow.js**: For animation model inference
- **WebCodecs API**: For video encoding (optional for 2D)
- **Canvas API**: For 2D skeleton drawing and animation

## Implementation Strategy

### Option 1: Online Pose Generation (Recommended for MVP)
**Pros**: Faster implementation, proven working system
**Cons**: Requires internet connection, API dependency

### Option 2: Offline Pose Generation (Future Enhancement)
**Pros**: Fully offline, no API dependencies
**Cons**: Requires custom model training, complex implementation

## Detailed Implementation Plan

### Step 1: Frontend Dependencies Setup

#### 1.1 Install Required Packages
```bash
cd frontend
npm install pose-viewer @tensorflow/tfjs @tensorflow/tfjs-backend-webgl
npm install --save-dev @types/dom-webcodecs
```

#### 1.2 Update package.json
Add the following dependencies to `frontend/package.json`:
```json
{
  "dependencies": {
    "pose-viewer": "^1.0.1",
    "@tensorflow/tfjs": "^4.22.0",
    "@tensorflow/tfjs-backend-webgl": "^4.22.0"
  },
  "devDependencies": {
    "@types/dom-webcodecs": "^0.1.15"
  }
}
```

### Step 2: Backend Pose Generation API Integration

#### 2.1 Create Pose Generation Service
**File**: `backend/api/pose_generation.py`

```python
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

POSE_API_URL = "https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_pose"

class PoseRequest(BaseModel):
    text: str
    spoken_language: str = "en"
    signed_language: str = "ase"

@router.post("/generate_pose")
async def generate_pose(request: PoseRequest):
    """
    Generate pose data from text using the translate project's API
    """
    try:
        # Construct the API URL
        params = {
            'text': request.text,
            'spoken': request.spoken_language,
            'signed': request.signed_language
        }
        
        # Make the API call
        response = requests.get(POSE_API_URL, params=params)
        response.raise_for_status()
        
        # The API returns a URL to pose data, we need to fetch it
        pose_data_url = response.text.strip()
        
        # Fetch the actual pose data
        pose_response = requests.get(pose_data_url)
        pose_response.raise_for_status()
        
        pose_data = pose_response.json()
        
        return {
            "pose_data": pose_data,
            "pose_url": pose_data_url
        }
        
    except requests.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Pose generation failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
```

#### 2.2 Update Main Backend
**File**: `backend/main.py`

Add the pose generation router:
```python
from .api.pose_generation import router as pose_generation_router

# Add this line after other router includes
app.include_router(pose_generation_router)
```

#### 2.3 Update Requirements
**File**: `backend/requirements-py311.txt`

Add requests if not already present:
```
requests
python-dotenv
```

### Step 3: Frontend Animation Service

#### 3.1 Create Animation Service
**File**: `frontend/src/services/AnimationService.ts`

```typescript
import * as tf from '@tensorflow/tfjs';

export interface PoseData {
  poseLandmarks: Array<{x: number, y: number, z: number}>;
  leftHandLandmarks?: Array<{x: number, y: number, z: number}>;
  rightHandLandmarks?: Array<{x: number, y: number, z: number}>;
  faceLandmarks?: Array<{x: number, y: number, z: number}>;
}

export interface AnimationConfig {
  width: number;
  height: number;
  fps: number;
  backgroundColor?: string;
  skeletonColor?: string;
  jointColor?: string;
}

export class AnimationService {
  private static instance: AnimationService;
  private tfInitialized = false;

  static getInstance(): AnimationService {
    if (!AnimationService.instance) {
      AnimationService.instance = new AnimationService();
    }
    return AnimationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.tfInitialized) return;
    
    await tf.ready();
    await tf.setBackend('webgl');
    this.tfInitialized = true;
  }

  async generatePoseFromText(text: string): Promise<PoseData[]> {
    try {
      const response = await fetch('http://127.0.0.1:8000/generate_pose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          spoken_language: 'en',
          signed_language: 'ase'
        })
      });

      if (!response.ok) {
        throw new Error(`Pose generation failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.pose_data;
    } catch (error) {
      console.error('Error generating pose:', error);
      throw error;
    }
  }

  normalizePoseData(poseData: PoseData[], config: AnimationConfig): number[][] {
    // Normalize pose data for animation
    return poseData.map(pose => {
      const landmarks = [
        ...(pose.poseLandmarks || []),
        ...(pose.leftHandLandmarks || []),
        ...(pose.rightHandLandmarks || [])
      ];
      
      return landmarks.flatMap(landmark => [landmark.x, landmark.y, landmark.z]);
    });
  }
}
```

#### 3.2 Create Skeleton Animation Component
**File**: `frontend/src/components/SkeletonAnimation.tsx`

```typescript
import React, { useEffect, useRef, useState } from 'react';
import { AnimationService, PoseData, AnimationConfig } from '../services/AnimationService';

interface SkeletonAnimationProps {
  poseData: PoseData[];
  config?: Partial<AnimationConfig>;
  onAnimationComplete?: () => void;
}

const SkeletonAnimation: React.FC<SkeletonAnimationProps> = ({
  poseData,
  config = {},
  onAnimationComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);

  const defaultConfig: AnimationConfig = {
    width: 640,
    height: 480,
    fps: 30,
    backgroundColor: '#000000',
    skeletonColor: '#00FF00',
    jointColor: '#FF0000',
    ...config
  };

  const drawSkeleton = (ctx: CanvasRenderingContext2D, pose: PoseData) => {
    const { width, height, skeletonColor, jointColor } = defaultConfig;
    
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = defaultConfig.backgroundColor || '#000000';
    ctx.fillRect(0, 0, width, height);

    // Draw pose landmarks
    if (pose.poseLandmarks) {
      ctx.strokeStyle = skeletonColor;
      ctx.lineWidth = 2;
      
      // Draw body connections
      this.drawBodyConnections(ctx, pose.poseLandmarks, width, height);
      
      // Draw joints
      ctx.fillStyle = jointColor;
      pose.poseLandmarks.forEach(landmark => {
        ctx.beginPath();
        ctx.arc(landmark.x * width, landmark.y * height, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // Draw hands
    if (pose.leftHandLandmarks) {
      this.drawHand(ctx, pose.leftHandLandmarks, '#FF0000', width, height);
    }
    
    if (pose.rightHandLandmarks) {
      this.drawHand(ctx, pose.rightHandLandmarks, '#00FF00', width, height);
    }
  };

  const drawBodyConnections = (
    ctx: CanvasRenderingContext2D, 
    landmarks: Array<{x: number, y: number, z: number}>, 
    width: number, 
    height: number
  ) => {
    // Define body connections (MediaPipe pose connections)
    const connections = [
      [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // Shoulders and arms
      [11, 23], [12, 24], [23, 24], // Torso
      [23, 25], [25, 27], [27, 29], [29, 31], // Left leg
      [24, 26], [26, 28], [28, 30], [30, 32], // Right leg
    ];

    connections.forEach(([start, end]) => {
      if (landmarks[start] && landmarks[end]) {
        ctx.beginPath();
        ctx.moveTo(landmarks[start].x * width, landmarks[start].y * height);
        ctx.lineTo(landmarks[end].x * width, landmarks[end].y * height);
        ctx.stroke();
      }
    });
  };

  const drawHand = (
    ctx: CanvasRenderingContext2D, 
    landmarks: Array<{x: number, y: number, z: number}>, 
    color: string, 
    width: number, 
    height: number
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    // Hand connections
    const handConnections = [
      [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // Index
      [0, 9], [9, 10], [10, 11], [11, 12], // Middle
      [0, 13], [13, 14], [14, 15], [15, 16], // Ring
      [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
    ];

    handConnections.forEach(([start, end]) => {
      if (landmarks[start] && landmarks[end]) {
        ctx.beginPath();
        ctx.moveTo(landmarks[start].x * width, landmarks[start].y * height);
        ctx.lineTo(landmarks[end].x * width, landmarks[end].y * height);
        ctx.stroke();
      }
    });

    // Draw hand joints
    ctx.fillStyle = color;
    landmarks.forEach(landmark => {
      ctx.beginPath();
      ctx.arc(landmark.x * width, landmark.y * height, 2, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  const animate = () => {
    if (currentFrame >= poseData.length) {
      setIsPlaying(false);
      onAnimationComplete?.();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawSkeleton(ctx, poseData[currentFrame]);
    setCurrentFrame(prev => prev + 1);

    animationRef.current = requestAnimationFrame(() => {
      setTimeout(animate, 1000 / defaultConfig.fps);
    });
  };

  const startAnimation = () => {
    if (poseData.length === 0) return;
    
    setIsPlaying(true);
    setCurrentFrame(0);
    animate();
  };

  const stopAnimation = () => {
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const resetAnimation = () => {
    stopAnimation();
    setCurrentFrame(0);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, defaultConfig.width, defaultConfig.height);
      }
    }
  };

  useEffect(() => {
    // Initialize TensorFlow.js
    AnimationService.getInstance().initialize();
  }, []);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="skeleton-animation-container">
      <canvas
        ref={canvasRef}
        width={defaultConfig.width}
        height={defaultConfig.height}
        style={{
          border: '1px solid #ccc',
          maxWidth: '100%',
          height: 'auto'
        }}
      />
      <div className="animation-controls">
        <button 
          onClick={isPlaying ? stopAnimation : startAnimation}
          className="px-4 py-2 rounded bg-blue-600 text-white mr-2"
        >
          {isPlaying ? 'Stop' : 'Play'}
        </button>
        <button 
          onClick={resetAnimation}
          className="px-4 py-2 rounded bg-gray-600 text-white"
        >
          Reset
        </button>
        <span className="ml-4 text-sm text-gray-600">
          Frame: {currentFrame + 1} / {poseData.length}
        </span>
      </div>
    </div>
  );
};

export default SkeletonAnimation;
```

### Step 4: Integration with Main App

#### 4.1 Update App.tsx
**File**: `frontend/src/App.tsx`

Add skeleton animation integration:

```typescript
// Add import
import SkeletonAnimation from './components/SkeletonAnimation';
import { AnimationService, PoseData } from './services/AnimationService';

// Add state
const [poseData, setPoseData] = useState<PoseData[]>([]);
const [isGeneratingPose, setIsGeneratingPose] = useState(false);

// Update handleRecordingComplete function
const handleRecordingComplete = async (audioBlob: Blob) => {
  // ... existing code ...

  try {
    // ... existing transcription and translation code ...

    // 4. Generate pose data for animation
    if (textToTranslate) {
      setIsGeneratingPose(true);
      const animationService = AnimationService.getInstance();
      const poseDataResult = await animationService.generatePoseFromText(textToTranslate);
      setPoseData(poseDataResult);
      setIsGeneratingPose(false);
    } else {
      setPoseData([]);
    }

  } catch (error) {
    console.error('Error processing audio:', error);
    setPoseData([]);
    setIsGeneratingPose(false);
  }
};

// Add to JSX
<div className="mt-6">
  <h2 className="text-xl font-semibold">2D Skeleton Animation:</h2>
  {isGeneratingPose && (
    <div className="text-blue-600">Generating pose data...</div>
  )}
  {poseData.length > 0 && (
    <SkeletonAnimation 
      poseData={poseData}
      config={{
        width: 640,
        height: 480,
        fps: 30,
        backgroundColor: '#1a1a1a',
        skeletonColor: '#00FF00',
        jointColor: '#FF0000'
      }}
      onAnimationComplete={() => console.log('Animation completed')}
    />
  )}
</div>
```

### Step 5: Enhanced Features (Optional)

#### 5.1 Video Export Feature
**File**: `frontend/src/services/VideoExportService.ts`

```typescript
export class VideoExportService {
  static async exportAnimationAsVideo(
    poseData: PoseData[], 
    config: AnimationConfig
  ): Promise<Blob> {
    // Implementation using WebCodecs API
    // Similar to translate project's playable-video-encoder.ts
  }
}
```

#### 5.2 Offline Pose Generation (Future)
**File**: `backend/api/offline_pose_generation.py`

```python
# Future implementation using local models
# This would require training custom models for text-to-pose conversion
```

## Testing Strategy

### 1. Unit Tests
- Test pose data normalization
- Test skeleton drawing functions
- Test animation timing

### 2. Integration Tests
- Test pose generation API integration
- Test end-to-end pipeline
- Test error handling

### 3. Performance Tests
- Test animation frame rate
- Test memory usage
- Test large pose data sets

## Error Handling

### 1. API Failures
- Fallback to static SignWriting display
- Retry mechanism for temporary failures
- User-friendly error messages

### 2. Browser Compatibility
- Feature detection for WebCodecs API
- Fallback for unsupported browsers
- Progressive enhancement

### 3. Performance Issues
- Frame rate adaptation
- Memory cleanup
- Animation pausing when tab is not visible

## Performance Optimization

### 1. Caching
- Cache pose data for repeated text
- Preload animation models
- Optimize canvas rendering

### 2. Memory Management
- Clean up TensorFlow.js memory
- Dispose of unused resources
- Monitor memory usage

### 3. Rendering Optimization
- Use RequestAnimationFrame
- Optimize canvas operations
- Reduce unnecessary redraws

## Security Considerations

### 1. API Security
- Validate input text
- Rate limiting
- Error message sanitization

### 2. Data Privacy
- No persistent storage of pose data
- Secure API communication
- User consent for data processing

## Future Enhancements

### 1. Offline Support
- Local pose generation models
- Cached pose data
- Offline animation playback

### 2. Customization
- Adjustable animation speed
- Custom skeleton colors
- Different animation styles

### 3. Advanced Features
- Real-time pose generation
- Multi-language support
- Accessibility features

## Implementation Timeline

### Week 1: Foundation
- Set up dependencies
- Implement basic pose generation API
- Create skeleton drawing functions

### Week 2: Core Features
- Implement animation service
- Create skeleton animation component
- Basic integration with main app

### Week 3: Enhancement
- Add video export feature
- Implement error handling
- Performance optimization

### Week 4: Testing & Polish
- Comprehensive testing
- Bug fixes
- Documentation

## Success Criteria

1. **Functional**: 2D skeleton animation plays correctly from text input
2. **Performance**: Smooth 30fps animation with <100ms latency
3. **Reliability**: Handles API failures gracefully
4. **User Experience**: Intuitive controls and visual feedback
5. **Compatibility**: Works across major browsers

## Dependencies

### Frontend
- `pose-viewer`: 2D skeleton visualization
- `@tensorflow/tfjs`: Animation model support
- `@tensorflow/tfjs-backend-webgl`: GPU acceleration

### Backend
- `requests`: HTTP client for API calls
- `python-dotenv`: Environment variable management

### Optional
- `webm-muxer`: Video export (WebM format)
- `mp4-muxer`: Video export (MP4 format)

## Conclusion

This implementation plan provides a comprehensive approach to integrating 2D skeleton animation into the SignBridge project. The solution leverages the proven animation system from the translate project while adapting it for the SignBridge architecture. The online pose generation approach ensures faster implementation while maintaining the option for future offline capabilities. 