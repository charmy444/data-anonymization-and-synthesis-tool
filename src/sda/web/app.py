import os

from fastapi import FastAPI
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from sda.core.domain.errors import SdaError
from sda.web.routers.anonymize import router as anonymize_router
from sda.web.routers.generate import router as generate_router
from sda.web.routers.health import router as health_router
from sda.web.routers.similar import router as similar_router
from sda.web.schemas.generate import ErrorResponse

API_PREFIX = "/api/v1"
DEFAULT_CORS_ORIGINS = (
    "http://127.0.0.1:3000",
    "http://localhost:3000",
)


def _load_cors_origins() -> list[str]:
    raw_value = os.getenv("SDA_CORS_ORIGINS", "")
    if not raw_value.strip():
        return list(DEFAULT_CORS_ORIGINS)

    return [
        origin.strip()
        for origin in raw_value.split(",")
        if origin.strip()
    ] or list(DEFAULT_CORS_ORIGINS)


def create_app() -> FastAPI:
    app = FastAPI(
        title="Synthetic Data Generator & Anonymizer API",
        description="API for synthetic CSV generation, anonymization, and similar-data synthesis.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=_load_cors_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router, prefix=API_PREFIX)
    app.include_router(generate_router, prefix=API_PREFIX)
    app.include_router(anonymize_router, prefix=API_PREFIX)
    app.include_router(similar_router, prefix=API_PREFIX)

    @app.exception_handler(SdaError)
    async def handle_sda_error(_, exc: SdaError) -> JSONResponse:
        payload = ErrorResponse(
            error_code=exc.error_code,
            message=exc.message,
            details=exc.details,
            request_id=None,
        ).model_dump()
        return JSONResponse(status_code=exc.status_code, content=payload)

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(_, exc: RequestValidationError) -> JSONResponse:
        payload = ErrorResponse(
            error_code="validation_error",
            message="Невалидный запрос.",
            details={"errors": jsonable_encoder(exc.errors())},
            request_id=None,
        ).model_dump()
        return JSONResponse(status_code=422, content=payload)

    @app.get("/", tags=["meta"])
    async def root() -> dict[str, object]:
        return {
            "name": "Synthetic Data Generator & Anonymizer API",
            "api_prefix": API_PREFIX,
            "docs_url": "/docs",
            "health_url": f"{API_PREFIX}/health",
        }

    return app


app = create_app()
