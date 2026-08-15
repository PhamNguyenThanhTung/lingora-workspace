from fastapi import FastAPI, Request, Depends, HTTPException, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.auth import verify_bearer_token
from app.schemas import (
    HealthResponse,
    ErrorResponse,
    SrsScheduleRequest,
    SrsScheduleResponse,
    ChatRoleplayRequest,
    ChatRoleplayResponse,
    ModelInfoResponse,
    ModelInfoItem,
)
from app.services.mock import (
    mock_srs_predictions,
    mock_chat_reply,
    SUPPORTED_SCENARIOS,
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Lingora AI Service API - Deterministic Mock & Inference Runtime",
    docs_url="/docs",
    redoc_url="/redoc"
)


# --- Standardized Error Envelope Handlers ---
@app.exception_handler(StarletteHTTPException)
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Formats all HTTPExceptions into the canonical Lingora error envelope."""
    if isinstance(exc.detail, dict) and "code" in exc.detail:
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.detail}
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": "HTTP_ERROR",
                "message": str(exc.detail),
                "detail": None
            }
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Formats Pydantic validation errors into standard Lingora error envelope."""
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": {
                "code": "INVALID_INPUT",
                "message": "Request validation failed.",
                "detail": exc.errors()
            }
        }
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Catches unhandled errors and returns 500 in standard envelope."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred on the AI server.",
                "detail": str(exc)
            }
        }
    )


# --- Health Endpoints ---
@app.get("/health/live", response_model=HealthResponse, tags=["Health"])
def health_live():
    """Public liveness probe. Returns 200 when the process can answer requests."""
    return HealthResponse(status="ok")


@app.get("/health/ready", response_model=HealthResponse, tags=["Health"])
def health_ready(response: Response):
    """
    Public readiness probe. Returns 200 when required capabilities are usable.
    When MOCK_MODE=False and real models are not loaded, returns 503.
    """
    if not settings.MOCK_MODE:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return HealthResponse(
            status="degraded",
            version=settings.VERSION,
            mock_mode=False,
            srs_ready=False,
            nlp_ready=False
        )

    return HealthResponse(
        status="ok",
        version=settings.VERSION,
        mock_mode=True,
        srs_ready=True,
        nlp_ready=True
    )


@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health_root():
    """Documented compatibility alias."""
    return HealthResponse(
        status="ok",
        version=settings.VERSION,
        mock_mode=settings.MOCK_MODE
    )


# --- Model Info Endpoint ---
@app.get("/v1/model/info", response_model=ModelInfoResponse, tags=["Model"])
def get_model_info():
    """Returns metadata for AI models deployed or mocked in Lingora."""
    return ModelInfoResponse(
        models=[
            ModelInfoItem(
                task="srs_prediction",
                name="dkt-lstm-v1.0.0",
                architecture="DKT-LSTM (Knowledge Tracing)",
                dataset="ASSISTments & Lingora Review Logs",
                target_metric="AUC >= 0.75",
                is_mock=settings.MOCK_MODE
            ),
            ModelInfoItem(
                task="roleplay_chat",
                name="chat-t5small-v1.0.0",
                architecture="T5-Small Seq2Seq",
                dataset="MultiWOZ Hotel Domain",
                target_metric="BLEU >= 15.0 / CoLA Acc >= 0.70",
                is_mock=settings.MOCK_MODE
            )
        ]
    )


# --- Inference Endpoints ---
@app.post("/v1/srs/schedule", response_model=SrsScheduleResponse, tags=["SRS"])
def schedule_srs(
    request: SrsScheduleRequest,
    _token_payload: dict = Depends(verify_bearer_token)
):
    """
    Receives review history for vocabulary items, predicts recall probability,
    and returns priority and recommended intervals. Protected by Bearer JWT.
    """
    if not settings.MOCK_MODE:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "MODEL_UNAVAILABLE",
                "message": "SRS prediction model is not available in non-mock mode.",
                "detail": {"mock_mode": False}
            }
        )

    if not request.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_INPUT",
                "message": "The 'items' list must not be empty.",
                "detail": {"field": "items"}
            }
        )

    predictions = mock_srs_predictions(request.items)

    return SrsScheduleResponse(
        predictions=predictions,
        model_version="mock-srs-v1",
        scheduler_version="mock-rule-v1",
        is_mock=True,
        latency_ms=10
    )


@app.post("/v1/chat/roleplay", response_model=ChatRoleplayResponse, tags=["Chat"])
def chat_roleplay(
    request: ChatRoleplayRequest,
    _token_payload: dict = Depends(verify_bearer_token)
):
    """
    Handles turn-based roleplay conversation with AI mock. Protected by Bearer JWT.
    """
    if not settings.MOCK_MODE:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "MODEL_UNAVAILABLE",
                "message": "Chat roleplay model is not available in non-mock mode.",
                "detail": {"mock_mode": False}
            }
        )

    if not request.user_message or not request.user_message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_INPUT",
                "message": "User message must not be empty.",
                "detail": {"field": "user_message"}
            }
        )

    if len(request.user_message) > 500:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={
                "code": "TEXT_TOO_LONG",
                "message": "User message exceeds maximum length of 500 characters.",
                "detail": {"max_chars": 500, "actual_chars": len(request.user_message)}
            }
        )

    if request.lang != "en":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "LANG_NOT_SUPPORTED",
                "message": f"Language '{request.lang}' is not supported. Only 'en' is supported.",
                "detail": {"supported_langs": ["en"]}
            }
        )

    if request.scenario_code not in SUPPORTED_SCENARIOS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "SCENARIO_NOT_FOUND",
                "message": f"Scenario code '{request.scenario_code}' not found or unpublished.",
                "detail": {"scenario_code": request.scenario_code}
            }
        )

    reply_data = mock_chat_reply(
        scenario_code=request.scenario_code,
        user_message=request.user_message
    )

    return ChatRoleplayResponse(**reply_data)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
