import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

_client: Groq | None = None


def get_groq() -> Groq:
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY must be set in .env")
        _client = Groq(api_key=api_key)
    return _client
