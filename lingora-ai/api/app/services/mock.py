import hashlib
from typing import List, Dict, Any

SUPPORTED_SCENARIOS = {"hotel_booking"}


def stable_mock_recall(vocabulary_id: str) -> float:
    """Calculates deterministic recall probability [0.30, 0.90] based on SHA-256 hash."""
    digest = hashlib.sha256(str(vocabulary_id).encode("utf-8")).digest()
    ratio = int.from_bytes(digest[:4], "big") / 0xFFFFFFFF
    return round(0.3 + ratio * 0.6, 2)


def determine_priority(recall_prob: float) -> str:
    if recall_prob < 0.5:
        return "REVIEW_NOW"
    elif recall_prob < 0.75:
        return "REVIEW_TODAY"
    else:
        return "REVIEW_LATER"


def calculate_interval(recall_prob: float, ease_factor: float = 2.5) -> float:
    if recall_prob < 0.5:
        return 1.0
    elif recall_prob < 0.75:
        return round(1.0 * ease_factor, 1)
    else:
        return round(2.0 * ease_factor, 1)


def mock_srs_predictions(items: List[Any]) -> List[Dict[str, Any]]:
    predictions = []
    for it in items:
        vocab_id = it.vocabulary_id if hasattr(it, "vocabulary_id") else it["vocabulary_id"]
        ease_factor = getattr(it, "ease_factor", 2.5)
        if ease_factor is None:
            ease_factor = 2.5
        recall = stable_mock_recall(str(vocab_id))
        priority = determine_priority(recall)
        interval = calculate_interval(recall, ease_factor)
        predictions.append({
            "vocabulary_id": str(vocab_id),
            "recall_probability": recall,
            "priority": priority,
            "recommended_interval_days": interval
        })
    return predictions


def mock_chat_reply(scenario_code: str, user_message: str) -> Dict[str, Any]:
    """Returns canonical mock response for hotel_booking scenario per docs/03 §5.2."""
    return {
        "ai_reply": "Sure! Could you tell me the check-in date you'd like?",
        "model_version": "chat-t5small-v1.0.0",
        "is_mock": True,
        "latency_ms": 15
    }
