from typing import Any, List, Optional
from pydantic import BaseModel, Field


# --- Common & Error Envelopes ---
class ErrorDetail(BaseModel):
    code: str
    message: str
    detail: Optional[Any] = None


class ErrorResponse(BaseModel):
    error: ErrorDetail


class HealthResponse(BaseModel):
    status: str
    version: Optional[str] = None
    mock_mode: Optional[bool] = None
    srs_ready: Optional[bool] = None
    nlp_ready: Optional[bool] = None


# --- SRS Inference ---
class ReviewHistoryItem(BaseModel):
    is_correct: bool
    interval_days: float
    reviewed_at: Optional[str] = None


class SrsScheduleItem(BaseModel):
    vocabulary_id: str
    ease_factor: Optional[float] = 2.5
    history: Optional[List[ReviewHistoryItem]] = Field(default_factory=list)


class SrsScheduleRequest(BaseModel):
    now: Optional[str] = None
    items: List[SrsScheduleItem]
    client: Optional[str] = None


class SrsPredictionItem(BaseModel):
    vocabulary_id: str
    recall_probability: float
    priority: str
    recommended_interval_days: float


class SrsScheduleResponse(BaseModel):
    predictions: List[SrsPredictionItem]
    model_version: str = "mock-srs-v1"
    scheduler_version: str = "mock-rule-v1"
    is_mock: bool = True
    latency_ms: int = 10


# --- Chat Roleplay ---
class ChatMessageHistory(BaseModel):
    role: str
    content: str


class ChatRoleplayRequest(BaseModel):
    scenario_code: str
    lang: str = "en"
    history: Optional[List[ChatMessageHistory]] = Field(default_factory=list)
    user_message: str
    client: Optional[str] = None


class ChatRoleplayResponse(BaseModel):
    ai_reply: str
    model_version: str = "chat-t5small-v1.0.0"
    is_mock: bool = True
    latency_ms: int = 15


# --- Model Info ---
class ModelInfoItem(BaseModel):
    task: str
    name: str
    architecture: str
    dataset: str
    target_metric: str
    is_mock: bool


class ModelInfoResponse(BaseModel):
    models: List[ModelInfoItem]
