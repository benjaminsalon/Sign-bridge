from fastapi import HTTPException
import requests
from pydantic import BaseModel
import tqdm
POSE_API_URL = "https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_pose"


class PoseRequest(BaseModel):
    text: str
    spoken_language: str = "en"
    signed_language: str = "ase"

def generate_pose(text):
    """
    Generate pose data from text using the translate project's API
    """
    try:
        # Construct the API URL
        params = {
            'text': text,
            'spoken': "en",
            'signed': "ase"
        }
        
        # Make the API call - it returns binary pose data directly
        response = requests.get(POSE_API_URL, params=params)
        response.raise_for_status()
        
        # The API returns binary pose data directly
        pose_data = response.content

        with open(f"/home/benjamin/lablab_signbridge/pose_dataset_gen/poses/{text}.pose", "wb") as pose_file:
            pose_file.write(pose_data)
        
        # For now, we'll return the binary data as base64 encoded
        # import base64
        # pose_data_b64 = base64.b64encode(pose_data).decode('utf-8')
        
        # return {
        #     "pose_data": pose_data_b64,
        #     "data_format": "binary_base64"
        # }
        
    except requests.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Pose generation failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}") 
    


with open("/home/benjamin/lablab_signbridge/pose_dataset_gen/10000words.txt","r") as words:
    words_str = []
    for _ in range(10000):
        word = words.readline()[:-1]
        words_str.append(word)

for word in tqdm.tqdm(words_str):
    generate_pose(word)

import pandas as pd

root_path = "poses/"
poses_list = []
for word in words_str:
    word_dict = {"path": f"{root_path}{word}.pose", "spoken_language": "en", "signed_language": "sgg", "start":0, "end": 0, "words": word, "glosses": word.capitalize(), "priority": 0}
    poses_list.append(word_dict)

signs = pd.DataFrame(poses_list)

signs.to_csv("/home/benjamin/lablab_signbridge/pose_dataset_gen/index.csv", index=False)