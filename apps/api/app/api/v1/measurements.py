import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.user import User
from app.models.measurement import Measurement
from app.schemas.measurement import MeasurementCreate, MeasurementResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/measurements", tags=["measurements"])

@router.post("", response_model=MeasurementResponse)
async def create_measurement(
    measurement_in: MeasurementCreate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    measurement = Measurement(
        user_id=current_user.id,
        **measurement_in.model_dump(exclude_unset=True)
    )
    db.add(measurement)
    await db.commit()
    await db.refresh(measurement)
    return measurement

@router.get("", response_model=list[MeasurementResponse])
async def list_measurements(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Measurement).filter(Measurement.user_id == current_user.id))
    return result.scalars().all()

@router.get("/{id}", response_model=MeasurementResponse)
async def get_measurement(id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Measurement).filter(Measurement.id == id, Measurement.user_id == current_user.id))
    measurement = result.scalar_one_or_none()
    if not measurement:
        raise HTTPException(status_code=404, detail="Measurement not found")
    return measurement
