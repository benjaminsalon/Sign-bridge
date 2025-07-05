# SignBridge Backend

## Overview

This backend provides the core API services for the SignBridge application, including:

- Offline speech-to-text transcription using Whisper.cpp
- Optional online text simplification via Groq API
- Text-to-SignWriting translation using the signwriting-translation package with PyTorch

## Features / Endpoints

### POST /transcribe

- Accepts: WAV audio file (multipart/form-data)
- Returns: JSON with transcribed text
- Uses: Whisper.cpp executable for offline transcription

### POST /simplify_text

- Accepts: JSON with text string
- Returns: JSON with simplified text string
- Uses: Groq API for optional online text simplification

### POST /translate_signwriting

- Accepts: JSON with text string
- Returns: JSON with SignWriting notation string
- Uses: signwriting-translation PyTorch model for text-to-sign translation

## Setup

### Python 3.13 Environment (Basic)

```bash
python3 -m venv backend/venv
source backend/venv/bin/activate
pip install -r backend/requirements.txt
```

### Python 3.11 Environment (For Text-to-SignWriting)

```bash
./setup_py311_env.sh
source py311_venv/bin/activate
```

## Running the Backend

Activate the desired environment and run:

```bash
uvicorn backend.main:app --reload
```

The backend will be available at `http://127.0.0.1:8000`.

## Notes

- The Whisper.cpp executable and model files must be present in the `whisper.cpp` directory.
- The Groq API key and URL should be configured in a `.env` file in the project root.
- The text-to-SignWriting translation requires the Python 3.11 environment due to PyTorch compatibility.

## Testing

Test scripts are located in the `tests/` directory:

- `test_transcribe.py`
- `test_simplify_text.py`
- `test_translate_signwriting.py`

Run tests using the appropriate Python environment.

## License

This project is licensed under the MIT License.
