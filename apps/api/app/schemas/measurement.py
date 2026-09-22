import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class MeasurementBase(BaseModel):
    height_cm: float | None = None
    weight_kg: float | None = None
    chest_cm: float | None = None
    waist_cm: float | None = None
    hip_cm: float | None = None
    shoulder_cm: float | None = None
    inseam_cm: float | None = None

class MeasurementCreate(MeasurementBase):
    fit_preference: str | None = None

class MeasurementResponse(MeasurementBase):
    id: uuid.UUID
    user_id: uuid.UUID
    recorded_at: datetime
    is_primary: bool
    extra_data: dict | None = None

    model_config = ConfigDict(from_attributes=True)
