from pydantic import BaseModel

class Candidate(BaseModel):
    user_id: str
    is_available: bool
    department_match: bool
    burnout_score: int
    weekly_hours: float
    fairness_shift_count: int

class ReplacementRequest(BaseModel):
    shift_id: str
    department_id: str
    candidates: list[Candidate]

class RankedCandidate(BaseModel):
    user_id: str
    score: int
    match_reason: str

class ReplacementResponse(BaseModel):
    ranked_candidates: list[RankedCandidate]
