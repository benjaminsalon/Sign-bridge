# SignBridge Backend: Windows Setup Guide

This guide will walk you through setting up and running the SignBridge backend on Windows, including all dependencies and build steps.

---

## 1. Install Python 3.11 and git

- Download the Python 3.11 installer from the [official website](https://www.python.org/downloads/release/python-3110/).


## 2. Install ffmpeg

- Download a Windows build from [ffmpeg.org/download.html](https://ffmpeg.org/download.html).
- Extract the archive (e.g., to `C:\ffmpeg`).
- Add the `bin` folder (e.g., `C:\ffmpeg\bin`) to your **System PATH**:
  - Open Start Menu, search for "Environment Variables".
  - Edit the `Path` variable and add the path to `ffmpeg\bin`.
- Verify installation:
  ```sh
  ffmpeg -version
  ```

---

## 3. Set Up Python Virtual Environment

```sh
python -m venv venv
venv\Scripts\activate
```

---

## 4. Install Python Dependencies

- For basic API (no ML):
  ```sh
  pip install -r requirements.txt
  ```
- For full ML/text-to-signwriting support:
  ```sh
  pip install -r requirements-py311.txt
  ```

---

## 5. Build whisper.cpp Executable

- Go to the `whisper.cpp` directory:
  ```sh
  cd ..\whisper.cpp
  ```
- Follow the build instructions in [`whisper.cpp/README.md`](../whisper.cpp/README.md). Typically, for Windows:
  1. Install [CMake](https://cmake.org/download/) and [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/).
  2. Open a **Developer Command Prompt for VS**.
  3. Run:
     ```sh
     mkdir build
     cd build
     cmake ..
     cmake --build . --config Release
     ```
  4. The `whisper-cli.exe` binary will be in `build/bin/`.
- Download a Whisper model (e.g., `ggml-base.en.bin`) and place it in `whisper.cpp/models/`.
  - See model download links in the `whisper.cpp/README.md`.

---

## 6. Configure Environment Variables (Optional, for Groq API)

- Create a `.env` file in the project root (same folder as `backend/`). Example:
  ```env
  GROQ_API_KEY=your_groq_api_key_here
  GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions
  ```

---

## 7. Run the Backend Server

- Activate your virtual environment if not already:
  ```sh
  venv\Scripts\activate
  ```
- Start the server:
  ```sh
  uvicorn backend.main:app --reload
  ```
- The backend will be available at [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## 8. Troubleshooting

- If you encounter issues with missing DLLs or build errors, ensure you have the correct Visual Studio Build Tools and CMake installed.
- For ffmpeg issues, double-check your PATH.
- For Python issues, ensure you are using Python 3.11 and the correct virtual environment is activated.

---

## 9. Additional Notes

- For text-to-signwriting translation, always use the Python 3.11 environment and install all dependencies from `requirements-py311.txt`.
- For more details on building and using whisper.cpp, see [`whisper.cpp/README.md`](../whisper.cpp/README.md).
- For API usage, see the main [README.md](README.md). 