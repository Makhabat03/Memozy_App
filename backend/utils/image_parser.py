import base64
from utils.groq_client import get_groq


def extract_text_from_image(image_bytes: bytes, mime_type: str = "image/jpeg") -> str:
    b64 = base64.standard_b64encode(image_bytes).decode("utf-8")
    groq = get_groq()

    response = groq.chat.completions.create(
        model="llama-4-scout-17b-16e-instruct",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime_type};base64,{b64}"},
                    },
                    {
                        "type": "text",
                        "text": "Extract and return all text visible in this image. Return only the raw text, no commentary.",
                    },
                ],
            }
        ],
        max_tokens=2048,
    )
    return response.choices[0].message.content or ""
