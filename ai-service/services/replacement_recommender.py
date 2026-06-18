from schemas.replacements import ReplacementRequest, ReplacementResponse, RankedCandidate

class ReplacementRecommenderService:
    @staticmethod
    def rank_candidates(request: ReplacementRequest) -> ReplacementResponse:
        ranked_list = []
        
        for candidate in request.candidates:
            if not candidate.is_available:
                continue
                
            score = 100
            reasons = []
            
            if candidate.department_match:
                score += 20
            else:
                score -= 10
                reasons.append("Cross-department")
                
            if candidate.burnout_score > 75:
                score -= 40
                reasons.append("High burnout risk")
            elif candidate.burnout_score < 25:
                score += 15
                
            if candidate.weekly_hours > 50:
                score -= 30
                reasons.append("Approaching overtime")
                
            # Fairness: penalize if they already have many shifts
            if candidate.fairness_shift_count > 5:
                score -= candidate.fairness_shift_count * 2
            else:
                score += (5 - candidate.fairness_shift_count) * 2
                
            if score > 100:
                reasons.append("Excellent match")
                
            reason_str = ", ".join(reasons) if reasons else "Good candidate"
            
            ranked_list.append(RankedCandidate(
                user_id=candidate.user_id,
                score=score,
                match_reason=reason_str
            ))
            
        # Sort descending by score
        ranked_list.sort(key=lambda x: x.score, reverse=True)
        return ReplacementResponse(ranked_candidates=ranked_list)
