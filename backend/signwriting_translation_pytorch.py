import torch
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from signwriting_translation.bin import load_sockeye_translator, tokenize_spoken_text, translate

router = APIRouter()

class TextRequest(BaseModel):
    text: str

@router.post("/translate_signwriting")
async def translate_signwriting(request: TextRequest):
    try:
        model_path = "sign/sockeye-text-to-factored-signwriting"
        spoken_language = "en"
        signed_language = "ase"

        translator, tokenizer_path = load_sockeye_translator(model_path)
        tokenized_text = tokenize_spoken_text(request.text)
        model_input = f"${spoken_language} ${signed_language} {tokenized_text}"
        outputs = translate(translator, [model_input])
        return {"signwriting": outputs[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")
