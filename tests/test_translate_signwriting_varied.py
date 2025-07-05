import requests

def test_varied_translations():
    url = "http://127.0.0.1:8000/translate_signwriting"
    test_sentences = [
        "Hello",
        "How are you?",
        "Good morning",
        "Thank you",
        "See you later"
    ]

    for sentence in test_sentences:
        response = requests.post(url, json={"text": sentence})
        print(f"Input: {sentence}")
        print("Status Code:", response.status_code)
        try:
            print("Response JSON:", response.json())
        except Exception as e:
            print("Failed to parse JSON response:", e)
            print("Response text:", response.text)
        print("-" * 40)

if __name__ == "__main__":
    test_varied_translations()
