from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import billing, analytics, knowledge_base, intelligence, ai_history, general, tags, discord
from dotenv import load_dotenv
import os
from rate_limiter import limiter, _rate_limit_exceeded_handler, RateLimitExceeded

load_dotenv()

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers with standardized prefixes
app.include_router(billing.router, prefix="/billing", tags=["Billing"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
app.include_router(knowledge_base.router, prefix="/knowledge", tags=["Knowledge Base"])
app.include_router(intelligence.router, prefix="/intelligence", tags=["Intelligence"])
app.include_router(ai_history.router, prefix="/intelligence/history", tags=["AI Chat History"])
app.include_router(general.router, tags=["General"])
app.include_router(tags.router, tags=["Tags"])
app.include_router(discord.router, prefix="/discord", tags=["Discord"])

@app.get("/")
def read_root():
    return {"status": "ok", "service": "ProjectPulse API"}
