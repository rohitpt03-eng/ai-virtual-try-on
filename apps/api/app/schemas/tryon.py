import uuid
from pydantic import BaseModel, ConfigDict
from app.models.tryon_session import TryOnStatus

class TryOnRequest(BaseModel):
    photo_id: str
    product_variant_id: uuid.UUID
    measurement_id: uuid.UUID | None = None
    measurement_data: dict | None = None

class TryOnStatusResponse(BaseModel):
    id: uuid.UUID
    status: TryOnStatus
    progress_message: str | None = None

class FitDetail(BaseModel):
    dimension: str
    user_value: float
    garment_value: float
    fit_label: str
    fit_score: float

class SizeRecommendation(BaseModel):
    recommended_size: str
    confidence: float
    fit_details: list[FitDetail] = []

class TryOnResultResponse(BaseModel):
    id: uuid.UUID
    status: TryOnStatus
    input_image_url: str
    output_image_url: str | None = None
    size_recommendation: SizeRecommendation | None = None
    fit_analysis: str | None = None
    processing_time_ms: int | None = None
    
    model_config = ConfigDict(from_attributes=True)
