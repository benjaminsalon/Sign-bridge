from io import BytesIO
from typing import BinaryIO
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

POSE_API_URL = "https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_pose"

class PoseRequest(BaseModel):
    text: str
    spoken_language: str = "en"
    signed_language: str = "ase"

@router.post("/generate_pose_online")
async def generate_pose_online(request: PoseRequest):
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
        
        # Make the API call - it returns binary pose data directly
        response = requests.get(POSE_API_URL, params=params)
        response.raise_for_status()
        
        # The API returns binary pose data directly
        pose_data = response.content
        
        # For now, we'll return the binary data as base64 encoded
        import base64
        pose_data_b64 = base64.b64encode(pose_data).decode('utf-8')
        
        return {
            "pose_data": pose_data_b64,
            "data_format": "binary_base64"
        }
        
    except requests.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Pose generation failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}") 
    
import sys
sys.path.append("spoken-to-signed-translation")
from spoken_to_signed.text_to_gloss.simple import text_to_gloss
from spoken_to_signed.bin import _gloss_to_pose


def text_to_pose(text: str, lexicon = "api/lexicon/pose_dataset_gen", spoken_language: str = "en", glosser : str = "simple", signed_language: str = "ase"):
    sentences = text_to_gloss(text, spoken_language, signed_language=signed_language)
    pose_data = _gloss_to_pose(sentences, lexicon, spoken_language, signed_language)

    return pose_data

import logging
logging.basicConfig(level=logging.DEBUG)

@router.post("/generate_pose")
async def generate_pose(request: PoseRequest):
    """
    Generate pose data from text using the translate project's API
    """
    try:
        
        pose = text_to_pose(text=request.text, spoken_language="en", signed_language="ase")
        with open("/tmp/pose.pose", "wb") as f:
            pose.write(f)
        with open("/tmp/pose.pose", "rb") as f:
            pose_data = f.read()
            
        # For now, we'll return the binary data as base64 encoded
        import base64
        pose_data_b64 = base64.b64encode(pose_data).decode('utf-8')
        
        return {
            "pose_data": pose_data_b64,
            "data_format": "binary_base64"
        }
        
    # except requests.RequestException as e:
    #     raise HTTPException(status_code=503, detail=f"Pose generation failed: {str(e)}")
    except Exception as e:
        logging.debug(e)
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}") 