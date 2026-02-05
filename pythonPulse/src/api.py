from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import billing, analytics, knowledge_base, intelligence, general
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

# Include Routers
app.include_router(billing.router, tags=["Billing"])
app.include_router(analytics.router, tags=["Analytics"])
app.include_router(knowledge_base.router, tags=["Knowledge Base"])
app.include_router(intelligence.router, tags=["Intelligence"])
app.include_router(general.router, tags=["General"])

@app.get("/")
def read_root():
    return {"status": "ok", "service": "ProjectPulse API"}
