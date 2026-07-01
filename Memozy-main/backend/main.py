from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routers import auth, cards, decks, study, gamify, social

app = FastAPI(title="FlashAI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:19006", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(cards.router)
app.include_router(decks.router)
app.include_router(study.router)
app.include_router(gamify.router)
app.include_router(social.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
