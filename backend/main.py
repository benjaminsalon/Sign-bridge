from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import uuid
import os
import shutil
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import UploadFile, File, HTTPException
import subprocess
import uuid
import os
import shutil
from backend.simplify_text import router as simplify_router

app = FastAPI()

# Allow CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "temp_audio"
os.makedirs(TEMP_DIR, exist_ok=True)

WHISPER_EXECUTABLE = "./whisper.cpp/build/bin/whisper-cli"  # Correct path to built executable

app.include_router(simplify_router)

from backend.signwriting_translation_pytorch import router as signwriting_router

app.include_router(signwriting_router)

@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    # Only accept wav files for now
    if audio.content_type not in ["audio/wav", "audio/x-wav", "audio/wave"]:
        raise HTTPException(status_code=400, detail="Invalid audio format. WAV required.")
    # Save uploaded audio to temp wav file
    temp_wav_filename = f"{uuid.uuid4()}.wav"
    temp_wav_filepath = os.path.join(TEMP_DIR, temp_wav_filename)
    with open(temp_wav_filepath, "wb") as f:
        shutil.copyfileobj(audio.file, f)
    # Run whisper.cpp executable on the wav file
    try:
        # Run whisper-cli with model path argument
        result = subprocess.run(
            [WHISPER_EXECUTABLE, "-m", "whisper.cpp/models/ggml-base.en.bin", "-f", temp_wav_filepath],
            capture_output=True,
            text=True,
            check=True,
        )
        # Parse transcription from stdout
        transcription = result.stdout.strip()
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {e.stderr}")
    finally:
        # Clean up temp wav file
        os.remove(temp_wav_filepath)
    return {"text": transcription}

