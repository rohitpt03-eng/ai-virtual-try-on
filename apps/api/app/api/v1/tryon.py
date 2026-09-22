import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.user import User
from app.models.product import ProductVariant
from app.models.tryon_session import TryOnSession, TryOnStatus
from app.schemas.tryon import TryOnRequest, TryOnStatusResponse, TryOnResultResponse
from app.api.deps import get_optional_user
from app.tasks.tryon_tasks import process_tryon, _process_tryon_async
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tryon", tags=["tryon"])

@router.post("", response_model=TryOnStatusResponse)
async def create_tryon(
    request: TryOnRequest, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db), 
    current_user: User | None = Depends(get_optional_user)
):
    input_image_url = f"{settings.UPLOAD_DIR}/{request.photo_id}"
    
    # Resolve variant: check if given ID is a variant ID or a product ID
    target_variant_id = request.product_variant_id
    v_result = await db.execute(select(ProductVariant).filter(ProductVariant.id == target_variant_id))
    variant = v_result.scalar_one_or_none()
    
    if not variant:
        # Check if product_variant_id was actually a product_id
        pv_result = await db.execute(select(ProductVariant).filter(ProductVariant.product_id == target_variant_id))
        variant = pv_result.scalar_one_or_none()
        if variant:
            target_variant_id = variant.id
        else:
            # Create a default variant if none found
            variant = ProductVariant(
                id=uuid.uuid4(),
                product_id=target_variant_id,
                size="M",
                color="default",
                garment_image_url="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80"
            )
            db.add(variant)
            await db.commit()
            target_variant_id = variant.id

    metadata_dict = {}
    if request.measurement_data:
        metadata_dict["measurement_data"] = request.measurement_data
    if request.measurement_id:
        metadata_dict["measurement_id"] = str(request.measurement_id)

    session = TryOnSession(
        id=uuid.uuid4(),
        user_id=current_user.id if current_user else None,
        product_variant_id=target_variant_id,
        input_image_url=input_image_url,
        status=TryOnStatus.PENDING,
        metadata_=metadata_dict
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    
    # Try dispatching via Celery; fallback to FastAPI BackgroundTasks if Celery/Redis is offline
    dispatched = False
    try:
        process_tryon.delay(str(session.id))
        dispatched = True
    except Exception as e:
        logger.warning(f"Celery unavailable ({e}), running try-on as background task.")
        background_tasks.add_task(_process_tryon_async, str(session.id))
    
    return session

@router.get("/{id}/status", response_model=TryOnStatusResponse)
async def get_tryon_status(
    id: uuid.UUID, 
    db: AsyncSession = Depends(get_db), 
    current_user: User | None = Depends(get_optional_user)
):
    query = select(TryOnSession).filter(TryOnSession.id == id)
    if current_user:
        query = query.filter((TryOnSession.user_id == current_user.id) | (TryOnSession.user_id.is_(None)))
    result = await db.execute(query)
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Try-on session not found")
    return session

@router.get("/{id}/result", response_model=TryOnResultResponse)
async def get_tryon_result(
    id: uuid.UUID, 
    db: AsyncSession = Depends(get_db), 
    current_user: User | None = Depends(get_optional_user)
):
    query = select(TryOnSession).filter(TryOnSession.id == id)
    if current_user:
        query = query.filter((TryOnSession.user_id == current_user.id) | (TryOnSession.user_id.is_(None)))
    result = await db.execute(query)
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Try-on session not found")
    if session.status != TryOnStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Try-on not completed yet")

    rec = None
    if session.metadata_ and "size_recommendation" in session.metadata_:
        rec = session.metadata_["size_recommendation"]

    return TryOnResultResponse(
        id=session.id,
        status=session.status,
        input_image_url=session.input_image_url,
        output_image_url=session.output_image_url or "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80",
        size_recommendation=rec,
        processing_time_ms=session.processing_time_ms or 2000
    )

@router.get("/history", response_model=list[TryOnResultResponse])
async def list_tryon_history(
    db: AsyncSession = Depends(get_db), 
    current_user: User | None = Depends(get_optional_user)
):
    query = select(TryOnSession).order_by(TryOnSession.created_at.desc())
    if current_user:
        query = query.filter(TryOnSession.user_id == current_user.id)
    else:
        query = query.filter(TryOnSession.user_id.is_(None)).limit(10)
    result = await db.execute(query)
    sessions = result.scalars().all()
    
    history_items = []
    for s in sessions:
        rec = s.metadata_.get("size_recommendation") if s.metadata_ else None
        history_items.append(
            TryOnResultResponse(
                id=s.id,
                status=s.status,
                input_image_url=s.input_image_url,
                output_image_url=s.output_image_url,
                size_recommendation=rec,
                processing_time_ms=s.processing_time_ms
            )
        )
    return history_items
