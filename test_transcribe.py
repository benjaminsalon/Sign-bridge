import requests

def test_transcribe():
    url = "http://127.0.0.1:8000/transcribe"
    audio_path = "test_audio.wav"  # Provide a valid WAV file path for testing

    with open(audio_path, "rb") as f:
        files = {"audio": ("test_audio.wav", f, "audio/wav")}
        response = requests.post(url, files=files)
        print("Status Code:", response.status_code)
        print("Response JSON:", response.json())

if __name__ == "__main__":
    test_transcribe()
