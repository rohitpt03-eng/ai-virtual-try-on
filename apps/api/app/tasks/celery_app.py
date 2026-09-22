from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "ai_tryon_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.tryon_tasks", "app.tasks.scraping_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)
