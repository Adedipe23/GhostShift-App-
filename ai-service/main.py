from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import burnout, replacements

app = FastAPI(
    title="GhostShift AI Service",
    version="1.0.0",
    description="AI-powered burnout risk calculation and scheduling microservice",
)

# ---------------------------------------------------------------------------
# CORS – allow all origins for development
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(burnout.router, prefix="/calculate-burnout", tags=["Burnout"])
app.include_router(replacements.router, prefix="/recommend-replacements", tags=["Replacements"])


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    """Liveness probe returns {status: ok}."""
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
