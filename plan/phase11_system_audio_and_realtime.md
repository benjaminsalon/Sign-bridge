# Phase 11: System Audio Capture & Real-Time Streaming

## Objective
Enable SignBridge to capture system audio (not just microphone), support real-time/continuous audio streaming, and optimize the pipeline for low-latency, robust performance across platforms.

---

## Key Goals
- Capture system audio (for meetings, videos, etc.) on Windows, macOS, and Linux
- Implement real-time/continuous audio streaming from frontend to backend
- Optimize for low-latency, near-instant transcription and translation
- Add error recovery and performance monitoring features

---

## Implementation Steps

### 1. **System Audio Capture (Cross-Platform)**
- **Windows:**
  - Use WASAPI loopback capture (e.g., via Electron/Node native modules, or Tauri plugin)
  - Explore open-source tools (e.g., VB-Audio, Soundflower, BlackHole) for routing audio
- **macOS:**
  - Use AVFoundation or CoreAudio APIs (may require user to install BlackHole or Loopback)
- **Linux:**
  - Use PulseAudio/ALSA loopback modules
- **Frontend Integration:**
  - Add UI option to select between microphone and system audio
  - Detect available devices and permissions
  - Document setup steps for users (especially on macOS/Linux)

### 2. **Real-Time Streaming Pipeline**
- Implement chunked/streaming audio upload from frontend to backend (e.g., WebSockets, HTTP/2, or chunked fetch)
- Backend: process audio in small chunks, return partial transcription/translation results as soon as available
- Update UI to display live/partial results (transcription, signwriting, animation)
- Ensure pipeline is robust to network jitter and interruptions

### 3. **Low-Latency Optimization**
- Minimize buffering and processing delays in frontend and backend
- Use async I/O and multi-threading for audio, model inference, and rendering
- Profile and tune each stage for latency (target < 200ms end-to-end if possible)
- Consider model quantization or batching for faster inference

### 4. **Error Recovery & Robustness**
- Detect and handle audio device errors, network drops, and backend failures
- Implement automatic reconnection and user feedback for recoverable errors
- Fallback to microphone if system audio capture fails

### 5. **Performance Monitoring**
- Add FPS and latency metrics to the UI (e.g., overlay or settings panel)
- Log performance data for debugging and optimization

### 6. **Documentation**
- Update user guide with system audio setup instructions for each OS
- Document real-time features, troubleshooting, and known limitations

---

## Deliverables
- System audio capture support for all platforms
- Real-time streaming pipeline (frontend and backend)
- Optimized, low-latency audio-to-sign pipeline
- Error recovery and performance monitoring features
- Updated documentation 