# Phase 13: Offline Pose Generation Integration

## Objective
Enable offline generation of `.pose` files from text input using the [spoken-to-signed-translation](https://github.com/sign-language-processing/spoken-to-signed-translation) pipeline, ensuring seamless compatibility with the current frontend and eliminating the need for an internet connection for pose generation.

---

## Key Steps
- Use the `spoken-to-signed-translation` Python package for local text-to-pose conversion
- Integrate the pipeline into the backend as a FastAPI endpoint
- Ensure the output `.pose` file is compatible with the frontend (pose-viewer)
- Document setup, usage, and troubleshooting

---

## Implementation Steps

### 1. **Backend Setup**

#### a. Install the Pipeline
- Add to your backend requirements:
  ```bash
  pip install git+https://github.com/ZurichNLP/spoken-to-signed-translation.git
  ```
- Or add to `requirements-py311.txt`:
  ```
  git+https://github.com/ZurichNLP/spoken-to-signed-translation.git
  ```

#### b. Download Lexicon and Assets
- Download the required lexicon for your target sign language:
  ```bash
  download_lexicon --name <signsuisse> --directory <path_to_directory>
  ```
- Store lexicon and any model files in a persistent backend directory (e.g., `backend/assets/lexicon/`).

### 2. **Implement Local Pose Generation Endpoint**
- Create a new FastAPI endpoint (e.g., `/generate_pose_offline`).
- Use the `text_to_gloss_to_pose` script from the installed package:
  ```python
  import subprocess
  import base64
  from fastapi import APIRouter, HTTPException
  import os

  router = APIRouter()

  @router.post('/generate_pose_offline')
  async def generate_pose_offline(request: PoseRequest):
      output_pose_path = '/tmp/output.pose'
      try:
          subprocess.run([
              'text_to_gloss_to_pose',
              '--text', request.text,
              '--glosser', 'simple',  # or 'spacylemma', 'rules', 'nmt'
              '--lexicon', '/path/to/lexicon',
              '--spoken-language', 'en',
              '--signed-language', 'ase',
              '--pose', output_pose_path
          ], check=True)
          with open(output_pose_path, 'rb') as f:
              pose_data = f.read()
          return {'pose_data': base64.b64encode(pose_data).decode('utf-8'), 'data_format': 'binary_base64'}
      except Exception as e:
          raise HTTPException(status_code=500, detail=str(e))
  ```
- Ensure the output format matches what your frontend expects (binary `.pose` file, base64-encoded).

### 3. **Backend Routing and Integration**
- Add the new endpoint to your backend's router.
- Optionally, allow switching between online and offline pose generation via a config or UI toggle.

### 4. **Frontend Integration**
- No changes needed if the API response format is identical to the current online API.
- Optionally, add a UI toggle to select between online and offline pose generation.

### 5. **Testing**
- Test the endpoint with various text inputs and verify that the generated `.pose` files are rendered correctly in your frontend.
- Compare results with the online API for quality and consistency.

### 6. **Documentation**
- Document the offline pose generation setup in your backend README.
- Include instructions for downloading lexicons, supported languages, and troubleshooting.

---

## Optional Enhancements
- **Advanced Glossing:** Experiment with different glossers (`simple`, `spacylemma`, `rules`, `nmt`) for better translation quality.
- **Multi-language Support:** Download and configure additional lexicons for other spoken/signed languages as needed.
- **Performance:** Profile the pipeline and optimize subprocess calls or consider direct Python API usage if available.

---

## References
- [spoken-to-signed-translation GitHub](https://github.com/sign-language-processing/spoken-to-signed-translation)
- [Pipeline Usage Example](https://github.com/sign-language-processing/spoken-to-signed-translation#usage) 