from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import uuid
import os
import shutil
import uvicorn
import tempfile
import logging
import asyncio

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import tempfile
import logging
import asyncio

from api.signwriting_translation_pytorch import router as signwriting_translation_pytorch_router
from api.simplify_text import router as simplify_text_router
from api.pose_generation import router as pose_generation_router
from api.transcribe import router as transcribe_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, "..")) 

WHISPER_EXECUTABLE = os.path.join(PROJECT_ROOT, "whisper.cpp/build/bin/whisper-cli")
WHISPER_MODEL = os.path.join(PROJECT_ROOT, "whisper.cpp/models/ggml-base.en.bin")

if not os.path.exists(WHISPER_EXECUTABLE):
    raise FileNotFoundError(f"Whisper executable not found at: {WHISPER_EXECUTABLE}")
if not os.path.exists(WHISPER_MODEL):
    raise FileNotFoundError(f"Whisper model not found at: {WHISPER_MODEL}")

logging.basicConfig(level=logging.DEBUG)

app.include_router(transcribe_router)

app.include_router(signwriting_translation_pytorch_router)
app.include_router(simplify_text_router)
app.include_router(pose_generation_router)
