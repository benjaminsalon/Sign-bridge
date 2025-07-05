from fastapi import APIRouter, UploadFile, File, HTTPException
import os
import tempfile
import logging
import asyncio

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, "..", "..")) 

WHISPER_EXECUTABLE = os.path.join(PROJECT_ROOT, "whisper.cpp/build/bin/whisper-cli")
WHISPER_MODEL = os.path.join(PROJECT_ROOT, "whisper.cpp/models/ggml-base.en.bin")

if not os.path.exists(WHISPER_EXECUTABLE):
    raise FileNotFoundError(f"Whisper executable not found at: {WHISPER_EXECUTABLE}")
if not os.path.exists(WHISPER_MODEL):
    raise FileNotFoundError(f"Whisper model not found at: {WHISPER_MODEL}")

logging.basicConfig(level=logging.DEBUG)

@router.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    input_filepath = None
    output_filepath = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as input_file:
            contents = await audio.read()
            if not contents:
                raise HTTPException(status_code=400, detail="Empty audio file uploaded.")
            input_file.write(contents)
            input_filepath = input_file.name
        
        logging.info(f"Uploaded audio saved to temporary file: {input_filepath}")
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as output_file:
            output_filepath = output_file.name

        ffmpeg_command = [
            "ffmpeg",
            "-i", input_filepath,
            "-vn",
            "-ar", "16000",
            "-ac", "1",
            "-c:a", "pcm_s16le",
            "-y",
            output_filepath
        ]
        
        logging.debug(f"Running ffmpeg command: {' '.join(ffmpeg_command)}")
        
        process = await asyncio.create_subprocess_exec(
            *ffmpeg_command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()

        ffmpeg_output = stderr.decode()
        logging.debug(f"FFmpeg output:\n{ffmpeg_output}")

        if process.returncode != 0:
            logging.error(f"FFmpeg conversion failed with code {process.returncode}")
            raise HTTPException(status_code=400, detail=f"Audio conversion failed: {ffmpeg_output}")
        
        if not os.path.exists(output_filepath) or os.path.getsize(output_filepath) < 44:
            logging.error("FFmpeg ran but produced an empty or invalid WAV file.")
            raise HTTPException(status_code=500, detail="Failed to produce a valid audio file for transcription.")

        logging.info(f"Converted audio to wav: {output_filepath}")

        whisper_command = [
            WHISPER_EXECUTABLE,
            "-m", WHISPER_MODEL,
            "-f", output_filepath,
            "-otxt" 
        ]
        
        logging.debug(f"Running whisper command: {' '.join(whisper_command)}")

        process = await asyncio.create_subprocess_exec(
            *whisper_command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            error_message = stderr.decode()
            logging.error(f"Whisper transcription error: {error_message}")
            raise HTTPException(status_code=500, detail=f"Transcription failed: {error_message}")
        
        transcription = stdout.decode().strip()
        logging.info(f"Transcription successful: '{transcription}'")

        # Clean transcription to remove timestamps like [00:00:00.000 --> 00:00:04.240]
        import re
        cleaned_lines = []
        for line in transcription.splitlines():
            # Remove timestamp patterns in square brackets
            cleaned_line = re.sub(r"\[\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}\]", "", line).strip()
            if cleaned_line:
                cleaned_lines.append(cleaned_line)
        cleaned_transcription = " ".join(cleaned_lines)

        return {"text": cleaned_transcription}

    finally:
        if input_filepath and os.path.exists(input_filepath):
            os.remove(input_filepath)
        if output_filepath and os.path.exists(output_filepath):
            os.remove(output_filepath)
