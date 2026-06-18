from fastapi import APIRouter
from schemas.replacements import ReplacementRequest, ReplacementResponse
from services.replacement_recommender import ReplacementRecommenderService

router = APIRouter()

@router.post("/", response_model=ReplacementResponse)
def recommend_replacements(request: ReplacementRequest):
    return ReplacementRecommenderService.rank_candidates(request)
