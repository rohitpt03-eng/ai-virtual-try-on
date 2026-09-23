import asyncio
from app.tasks.celery_app import celery_app
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.product import Product
# from app.services.scraper import scrape_product

@celery_app.task
def scrape_product_task(url: str, product_id: str):
    asyncio.run(_scrape_product_async(url, product_id))

async def _scrape_product_async(url: str, product_id: str):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Product).filter(Product.id == product_id))
        product = result.scalar_one_or_none()
        
        if not product:
            return
            
        try:
            # TODO: Call scraper service
            product.name = "Scraped Product"
            product.description = f"Scraped from {url}"
            await db.commit()
        except Exception as e:
            # Log error
            pass
