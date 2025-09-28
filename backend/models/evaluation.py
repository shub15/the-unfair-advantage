from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum


class EvaluationCriteria(Enum):
    """Evaluation criteria for business cases"""

    MARKET_POTENTIAL = "market_potential"
    FEASIBILITY = "feasibility"
    COMPETITIVE_ADVANTAGE = "competitive_advantage"
    SCALABILITY = "scalability"
    INNOVATION = "innovation"
    FINANCIAL_VIABILITY = "financial_viability"
    EXECUTION_RISK = "execution_risk"
    TEAM_CAPABILITY = "team_capability"


@dataclass
class EvaluationScore:
    """Individual score for a specific criterion"""

    criterion: EvaluationCriteria
    score: float  # 0-100
    weight: float = 1.0
    explanation: str = ""
    recommendations: List[str] = field(default_factory=list)

    def weighted_score(self) -> float:
        """Calculate weighted score"""
        return self.score * self.weight


@dataclass
class EvaluationResult:
    """Complete evaluation result for a business case"""

    business_case_id: str
    overall_score: float  # 0-100
    evaluation_scores: List[EvaluationScore] = field(default_factory=list)

    # Detailed analysis
    strengths: List[str] = field(default_factory=list)
    weaknesses: List[str] = field(default_factory=list)
    opportunities: List[str] = field(default_factory=list)
    threats: List[str] = field(default_factory=list)

    # Recommendations
    next_steps: List[str] = field(default_factory=list)
    key_recommendations: List[str] = field(default_factory=list)

    # Market insights
    market_size_estimate: Optional[str] = None
    target_audience: Optional[str] = None
    competitive_landscape: Optional[str] = None

    # Financial projections
    revenue_potential: Optional[str] = None
    cost_structure: Optional[str] = None
    funding_requirements: Optional[str] = None

    # Risk assessment
    major_risks: List[str] = field(default_factory=list)
    mitigation_strategies: List[str] = field(default_factory=list)

    # Metadata
    evaluation_date: datetime = field(default_factory=datetime.now)
    model_version: str = "1.0"
    processing_time: Optional[float] = None

    def get_score_by_criterion(
        self, criterion: EvaluationCriteria
    ) -> Optional[EvaluationScore]:
        """Get score for a specific criterion"""
        for score in self.evaluation_scores:
            if score.criterion == criterion:
                return score
        return None

    def get_grade(self) -> str:
        """Get letter grade based on overall score"""
        if self.overall_score >= 90:
            return "A+"
        elif self.overall_score >= 85:
            return "A"
        elif self.overall_score >= 80:
            return "A-"
        elif self.overall_score >= 75:
            return "B+"
        elif self.overall_score >= 70:
            return "B"
        elif self.overall_score >= 65:
            return "B-"
        elif self.overall_score >= 60:
            return "C+"
        elif self.overall_score >= 55:
            return "C"
        elif self.overall_score >= 50:
            return "C-"
        else:
            return "D"

    def get_potential_label(self) -> str:
        """Get potential label based on overall score"""
        if self.overall_score >= 80:
            return "Excellent Potential"
        elif self.overall_score >= 60:
            return "Good Potential"
        elif self.overall_score >= 40:
            return "Moderate Potential"
        else:
            return "Needs Improvement"

    def to_dict(self) -> Dict[str, Any]:
        """Convert evaluation result to dictionary"""
        return {
            "business_case_id": self.business_case_id,
            "overall_score": self.overall_score,
            "grade": self.get_grade(),
            "potential_label": self.get_potential_label(),
            "evaluation_scores": [
                {
                    "criterion": score.criterion.value,
                    "score": score.score,
                    "weight": score.weight,
                    "weighted_score": score.weighted_score(),
                    "explanation": score.explanation,
                    "recommendations": score.recommendations,
                }
                for score in self.evaluation_scores
            ],
            "strengths": self.strengths,
            "weaknesses": self.weaknesses,
            "opportunities": self.opportunities,
            "threats": self.threats,
            "next_steps": self.next_steps,
            "key_recommendations": self.key_recommendations,
            "market_size_estimate": self.market_size_estimate,
            "target_audience": self.target_audience,
            "competitive_landscape": self.competitive_landscape,
            "revenue_potential": self.revenue_potential,
            "cost_structure": self.cost_structure,
            "funding_requirements": self.funding_requirements,
            "major_risks": self.major_risks,
            "mitigation_strategies": self.mitigation_strategies,
            "evaluation_date": self.evaluation_date.isoformat(),
            "model_version": self.model_version,
            "processing_time": self.processing_time,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "EvaluationResult":
        """Create evaluation result from dictionary"""
        evaluation_scores = []
        for score_data in data.get("evaluation_scores", []):
            score = EvaluationScore(
                criterion=EvaluationCriteria(score_data["criterion"]),
                score=score_data["score"],
                weight=score_data.get("weight", 1.0),
                explanation=score_data.get("explanation", ""),
                recommendations=score_data.get("recommendations", []),
            )
            evaluation_scores.append(score)

        return cls(
            business_case_id=data["business_case_id"],
            overall_score=data["overall_score"],
            evaluation_scores=evaluation_scores,
            strengths=data.get("strengths", []),
            weaknesses=data.get("weaknesses", []),
            opportunities=data.get("opportunities", []),
            threats=data.get("threats", []),
            next_steps=data.get("next_steps", []),
            key_recommendations=data.get("key_recommendations", []),
            market_size_estimate=data.get("market_size_estimate"),
            target_audience=data.get("target_audience"),
            competitive_landscape=data.get("competitive_landscape"),
            revenue_potential=data.get("revenue_potential"),
            cost_structure=data.get("cost_structure"),
            funding_requirements=data.get("funding_requirements"),
            major_risks=data.get("major_risks", []),
            mitigation_strategies=data.get("mitigation_strategies", []),
            evaluation_date=(
                datetime.fromisoformat(data["evaluation_date"])
                if "evaluation_date" in data
                else datetime.now()
            ),
            model_version=data.get("model_version", "1.0"),
            processing_time=data.get("processing_time"),
        )
