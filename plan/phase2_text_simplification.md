# Phase 2: Optional Text Simplification (Online)

## Objective
Add an optional online text simplification feature using Groq API and LLaMA model to simplify transcribed text for easier sign translation.

## Tasks
1. Add UI toggle in frontend to enable/disable text simplification.
2. Register and obtain Groq API credentials.
3. Implement FastAPI endpoint `/simplify_text` to:
   - Receive text from frontend.
   - Call Groq API with prompt: "Simplify the following sentence for easy sign-translation: {input_text}".
   - Handle errors and fallback to original text if offline or API fails.
4. Integrate simplified text flow in the app pipeline.
5. Test and compare original vs simplified text outputs.

## Resources
- Groq API documentation: https://api.groq.com
- LLaMA model integration via Groq API.

## Deliverables
- Frontend toggle for simplification.
- FastAPI `/simplify_text` endpoint.
- Error handling and fallback logic.
- Test cases demonstrating simplification.
