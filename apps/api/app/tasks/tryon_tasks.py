"""Celery tasks for virtual try-on processing pipeline.

Orchestrates the full try-on flow: fetching images, calling the AI API,
computing size recommendations, and storing results.
"""

import asyncio
import logging
import time
import uuid

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.tryon_session import TryOnSession, TryOnStatus
from app.models.product import ProductVariant
from app.models.measurement import Measurement
from app.services.tryon_service import generate_tryon, TryOnError
from app.services.size_calculator import recommend_size
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    bind=True,
    max_retries=2,
    default_retry_delay=10,
    acks_late=True,
)
def process_tryon(self, session_id: str):
    """Main try-on processing task. Runs the full pipeline."""
    try:
        asyncio.run(_process_tryon_async(session_id))
    except TryOnError as e:
        logger.error(f"Try-on failed for session {session_id}: {e}")
        # Retry on transient failures
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e)
        # Mark as failed after all retries exhausted
        asyncio.run(_mark_failed(session_id, str(e)))
    except Exception as e:
        logger.exception(f"Unexpected error in try-on session {session_id}")
        asyncio.run(_mark_failed(session_id, f"Internal error: {str(e)}"))


async def _process_tryon_async(session_id: str):
    """Async implementation of the try-on pipeline."""
    async with AsyncSessionLocal() as db:
        # 1. Load session with related data
        result = await db.execute(
            select(TryOnSession).filter(TryOnSession.id == session_id)
        )
        session = result.scalar_one_or_none()

        if not session:
            logger.error(f"Try-on session not found: {session_id}")
            return

        try:
            # 2. Update status to processing
            session.status = TryOnStatus.PROCESSING
            await db.commit()

            # 3. Fetch product variant for garment image
            variant_result = await db.execute(
                select(ProductVariant).filter(
                    ProductVariant.id == session.product_variant_id
                )
            )
            variant = variant_result.scalar_one_or_none()

            if not variant or not variant.garment_image_url:
                raise TryOnError("Product variant or garment image not found")

            # 4. Call AI try-on API
            person_image_url = session.input_image_url
            garment_image_url = variant.garment_image_url

            logger.info(
                f"Generating try-on for session {session_id}: "
                f"person={person_image_url}, garment={garment_image_url}"
            )

            start_time = time.time()
            tryon_result = generate_tryon(
                person_image_url=person_image_url,
                garment_image_url=garment_image_url,
                clothing_type=variant.color,  # Will be mapped to category
            )

            # 5. Compute size recommendation if measurements exist
            size_recommendation = None
            user_meas = {}
            fit_pref = "regular"

            if session.metadata_ and session.metadata_.get("measurement_data"):
                m_data = session.metadata_["measurement_data"]
                fit_pref = m_data.get("fit_preference") or m_data.get("fitPreference") or "regular"
                user_meas = {
                    "chest_cm": float(m_data.get("chest_cm") or m_data.get("chestCm") or 96),
                    "waist_cm": float(m_data.get("waist_cm") or m_data.get("waistCm") or 80),
                    "hip_cm": float(m_data.get("hip_cm") or m_data.get("hipCm") or 100),
                    "shoulder_cm": float(m_data.get("shoulder_cm") or m_data.get("shoulderCm") or 44),
                    "inseam_cm": float(m_data.get("inseam_cm") or m_data.get("inseamCm") or 78),
                }
            elif session.metadata_ and session.metadata_.get("measurement_id"):
                measurement_id = session.metadata_["measurement_id"]
                meas_result = await db.execute(
                    select(Measurement).filter(
                        Measurement.id == measurement_id
                    )
                )
                measurement = meas_result.scalar_one_or_none()

                if measurement:
                    if measurement.chest_cm:
                        user_meas["chest_cm"] = float(measurement.chest_cm)
                    if measurement.waist_cm:
                        user_meas["waist_cm"] = float(measurement.waist_cm)
                    if measurement.hip_cm:
                        user_meas["hip_cm"] = float(measurement.hip_cm)
                    if measurement.shoulder_cm:
                        user_meas["shoulder_cm"] = float(measurement.shoulder_cm)
                    if measurement.inseam_cm:
                        user_meas["inseam_cm"] = float(measurement.inseam_cm)
                    fit_pref = session.metadata_.get("fit_preference", "regular")

            if not user_meas:
                # Default standard measurements if none provided
                user_meas = {"chest_cm": 96, "waist_cm": 80, "hip_cm": 100, "shoulder_cm": 44, "length_cm": 70}

            size_chart = variant.dimensions if (variant.dimensions and isinstance(variant.dimensions, dict) and len(variant.dimensions) > 0) else None

            size_recommendation = recommend_size(
                user_measurements=user_meas,
                size_chart=size_chart,
                fit_preference=fit_pref,
            )

            # 6. Update session with results
            elapsed_ms = int((time.time() - start_time) * 1000)
            session.output_image_url = tryon_result["result_image_url"]
            session.model_version = tryon_result["model_version"]
            session.processing_time_ms = tryon_result["processing_time_ms"]
            session.status = TryOnStatus.COMPLETED
            session.metadata_ = {
                **(session.metadata_ or {}),
                "size_recommendation": size_recommendation,
                "total_pipeline_time_ms": elapsed_ms,
            }
            await db.commit()

            logger.info(
                f"Try-on completed for session {session_id} "
                f"in {elapsed_ms}ms"
            )

        except TryOnError:
            raise  # Let the task retry handler deal with it
        except Exception as e:
            session.status = TryOnStatus.FAILED
            session.error_message = str(e)
            await db.commit()
            raise


async def _mark_failed(session_id: str, error_message: str):
    """Mark a try-on session as failed in the database."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(TryOnSession).filter(TryOnSession.id == session_id)
        )
        session = result.scalar_one_or_none()
        if session:
            session.status = TryOnStatus.FAILED
            session.error_message = error_message
            await db.commit()
