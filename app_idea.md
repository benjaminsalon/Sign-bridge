SignBridge: Real‑time Voice‑to‑Sign Translator

1. Hackathon Track & Criteria
Track: Edge AI Consumer Utility Application (Snapdragon® X Elite)
Must‑meet requirements:
Consumer‑Oriented: Clear everyday value for a broad audience.
Utility‑Focused: Helps users accomplish a task.
Edge AI‑Powered: Probabilistic AI component runs locally (no cloud).
Fully On‑device: Core functionality works offline.
Cross‑Platform: Compatible with Snapdragon X Elite, Windows, macOS, Linux.
Developer‑Ready: GitHub repo with setup & run instructions.
Groq API Integration: Use Groq to accelerate LLaMA inference.
LLaMA Model: At least one LLaMA‑family model in the pipeline.
Optional boosters (recommended): MCP, Compound‑beta, Groq Speech Models

2. High‑Level Architecture
[ Microphone Input ]
      ↓ (1)
[ Speech‑to‑Text ]
      ↓ (2) ──▶ [Optional: Text Simplification (LLaMA via Groq; requires internet/UI toggle)]
      ↓ (3)
[ Text → SignWriting ]
      ↓ (4)
[ SignRendering / Animation ]
      ↓
[ On‑screen Output ]
Notes:
Optional Simplification: User can toggle "Simplify Text (online)" in the UI; app still works fully offline if off.
Reverse Mode: Not included in this MVP.

3. Step‑by‑Step Implementation Plan
Phase 1: Speech‑to‑Text (Offline)
Choose engine: Whisper.cpp (C++ implementation runs on-device)
Build & integrate: Compile for target platforms (Win/macOS/Linux & Snapdragon X Elite).
Test: Run sample audio → text transcription offline.
Phase 2: Optional Text Simplification (Online)
UI Toggle: Add a checkbox or switch labeled "Enable Text Simplification (requires Internet)".
Groq API Integration:
Register for Groq API credentials.
Endpoint template: POST https://api.groq.com/v1/llama4/inference (adjust per docs).
Prompt: "Simplify the following sentence for easy sign‑translation: {input_text}".
Error Handling: If offline or API fails, fall back to original text.
Testing: Compare original vs. simplified outputs on sample sentences.
Phase 3: Text → SignWriting
SignWriting model: Download from HuggingFace:
https://huggingface.co/sign/sockeye-text-to-factored-signwriting
Local inference:
Use PyTorch or ONNX runtime for on‑device inference.
Sample code repository: sign-language-processing/signwriting-translation
Integration: Pass the (simplified) text into the model to obtain SignWriting notation.
Phase 4: SignWriting → Animation
Renderer choice:
Option A (MVP): use the animation iused in the sign.mt ->  sign/translate UI repo.
Performance: Ensure rendering runs at a good speed on Snapdragon X Elite.
Phase 5: Cross‑Platform Packaging & UI
Framework: Electron, Tauri, or native GUI (Qt, Tkinter) — choose the language your team knows best.
UI Components:
Microphone start/stop
Toggle for text simplification
Live text transcription window
Live SignWriting/animation window
Build Scripts: Create build targets for Windows, macOS, Linux, and Snapdragon Linux/Windows variants.
Documentation: Draft README.md with prerequisites, build & run steps, API key setup.
phase 5: Real-time feature, if possible for meetings, videos ... using the system sound
Some Suggestions on technologies and methodology (If you can do it using a better technology and a better method, you are allowed to do it):
1. The Frontend: Tauri (with JavaScript)
Why Tauri?
Frontend Responsibilities:
UI/UX: All visual components (buttons, text areas, animation canvas).
Microphone Access: Use the standard browser navigator.mediaDevices.getUserMedia API to capture audio.
The point of audio is to make as much accessible as possible. The app should not just record the audio, it should be able to take system audio as well, for example, for realtime translation from a video, or a meeting.
Data Flow:
Capture a chunk of audio (e.g., every 1-2 seconds). 
Send this audio data to your local Python backend via an HTTP request (fetch).
Receive the final SignWriting data from the backend.
Render the SignWriting
animation using the already existing code of sign.mt
2. The Backend: Python (with FastAPI)
Why FastAPI?
FastAPI is a modern, high-performance Python web framework. It's incredibly easy to set up, ridiculously fast, and automatically generates API documentation, which is a lifesaver in a hackathon.
Backend Responsibilities:
This will be a simple local server that runs only on the user's machine. It will expose a few API endpoints that your Tauri frontend will call.
Endpoint 1: POST /transcribe
What it does: Receives raw audio data from the frontend.
Implementation:
Saves the incoming audio to a temporary .wav file.
Calls the whisper.cpp executable as a command-line subprocess, pointing it to the temp file. (e.g., subprocess.run(["./whisper", "-f", "temp.wav"]))
Reads the transcribed text from the output.
Returns the text as a JSON response.
This is much easier than dealing with C++ bindings directly.
Endpoint 2: POST /translate_signwriting
What it does: Receives text (either original or simplified) from the frontend.
Implementation:
Loads the HuggingFace SignWriting model (using torch or onnxruntime) once when the server starts.
Runs the received text through the model for inference.
Returns the resulting SignWriting notation string as a JSON response.
Endpoint 3 (Optional): POST /simplify_text
What it does: Handles the optional online simplification.
Implementation:
Receives text from the frontend.
Makes an API call to the Groq API using Python's requests library.
Returns the simplified text from Groq. (This keeps your Groq API key securely in the backend, not exposed in the JS frontend).
3. The "Glue": Tauri Sidecar Feature
This is the magic that makes it all work seamlessly. Tauri has a built-in "sidecar" feature.
You configure your Tauri app to automatically bundle and manage your Python backend.
When a user launches your SignBridge.exe (or .dmg/.AppImage), Tauri will automatically start your Python API server in the background.
When the user closes the app, Tauri automatically shuts the Python server down.
4. References & Links
Component
Repository / Link
Whisper.cpp (STT)
https://github.com/ggerganov/whisper.cpp




SignWriting Translation
https://github.com/sign-language-processing/signwriting-translation
HuggingFace Model
https://huggingface.co/sign/sockeye-text-to-factored-signwriting
Sign.translate UI Repo
https://github.com/sign/translate the website sign.mt
SignBank Dataset
https://github.com/sign-language-processing/signbank-plus


5. Deliverables
GitHub Repo with:
Source code for all phases
Build scripts and CI (optional)
README.md with clear instructions
Demo Video/Screenshots showing offline pipeline and optional online simplification
(Optional) Performance Metrics: fps and latency on Snapdragon X Elite

Some extra links:
English text to signwriting using their cloud API:
https://sign.mt/api/spoken-to-signed?from=en&to=ase&text=test

A repo containing data, and some of the old machine learning models sign.mt is using.
https://github.com/J22Melody/signwriting-translation/
sign.mt no longer relies on the API provided by the above repo to translate from text to SignWriting.
It now uses a model trained here (which supports more languages and better fingerspelling):
https://github.com/sign-language-processing/signwriting-translation
and stored here:
https://huggingface.co/sign/sockeye-text-to-factored-signwriting/tree/main





