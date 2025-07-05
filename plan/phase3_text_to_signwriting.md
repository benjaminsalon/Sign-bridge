# Phase 3: Text to SignWriting Translation

## Objective
Translate (simplified) text into SignWriting notation using the HuggingFace model for on-device inference.

## Tasks
1. Download the SignWriting model from HuggingFace:
   https://huggingface.co/sign/sockeye-text-to-factored-signwriting
2. Integrate the model into the Python backend using PyTorch or ONNX runtime.
3. Implement FastAPI endpoint `/translate_signwriting` to:
   - Receive text input.
   - Run inference with the SignWriting model.
   - Return SignWriting notation string as JSON.
4. Test translation accuracy and performance.
5. Ensure model loads once at server start for efficiency.

## Resources
- SignWriting Translation repo: https://github.com/sign-language-processing/signwriting-translation
- HuggingFace model: https://huggingface.co/sign/sockeye-text-to-factored-signwriting

## Deliverables
- Integrated SignWriting model in backend.
- FastAPI `/translate_signwriting` endpoint.
- Test cases for text to SignWriting translation.
