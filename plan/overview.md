# SignBridge Project Overview

## Project Goal
Build SignBridge, a real-time voice-to-sign translator app that runs fully on-device with optional online text simplification. The app will be cross-platform (Windows, macOS, Linux, Snapdragon X Elite) and leverage Edge AI technologies.

## Key Features
- Offline speech-to-text transcription using Whisper.cpp
- Optional online text simplification via Groq API and LLaMA model
- Text to SignWriting translation using HuggingFace model
- SignWriting animation rendering
- Cross-platform UI with real-time audio capture and display
- Fully on-device core functionality with optional online enhancements

## Technologies
- Frontend: Tauri (JavaScript/TypeScript)
- Backend: Python with FastAPI
- Speech-to-Text: Whisper.cpp (C++ on-device)
- Text Simplification: Groq API with LLaMA model (optional, online)
- Text to SignWriting: HuggingFace model with PyTorch or ONNX runtime
- Animation Renderer: sign.mt animation codebase
- Packaging: Tauri sidecar for bundling Python backend

## References
- Whisper.cpp: https://github.com/ggerganov/whisper.cpp
- SignWriting Translation: https://github.com/sign-language-processing/signwriting-translation
- HuggingFace Model: https://huggingface.co/sign/sockeye-text-to-factored-signwriting
- Sign.translate UI Repo: https://github.com/sign/translate
- SignBank Dataset: https://github.com/sign-language-processing/signbank-plus
- Groq API: https://api.groq.com

---

This document provides a high-level overview. Detailed phase-wise plans follow.
