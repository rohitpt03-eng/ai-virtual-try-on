import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.product import Product
from app.schemas.product import ProductResponse, ProductExtractRequest
from app.tasks.scraping_tasks import scrape_product_task

from app.services.scraper import scrape_product
from app.models.product import ProductVariant

router = APIRouter(prefix="/products", tags=["products"])

@router.post("/extract", response_model=dict)
async def extract_product(request: ProductExtractRequest, db: AsyncSession = Depends(get_db)):
    scraped = scrape_product(request.url)
    
    product = Product(
        id=uuid.uuid4(),
        name=scraped.get("name") or "Curated Clothing",
        brand=scraped.get("brand") or "Fashion Store",
        category=scraped.get("category") or "tops",
        base_price=float(scraped.get("price") or 39.99),
        source_url=request.url,
        image_urls=scraped.get("image_urls") or ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80"],
    )
    db.add(product)
    
    sizes = scraped.get("sizes") or ["S", "M", "L", "XL"]
    garment_img = product.image_urls[0] if product.image_urls else "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80"
    
    variants = []
    for s in sizes:
        variant = ProductVariant(
            id=uuid.uuid4(),
            product_id=product.id,
            size=s,
            color=product.category or "tops",
            garment_image_url=garment_img,
            dimensions=scraped.get("size_chart") or {}
        )
        db.add(variant)
        variants.append(variant)
        
    await db.commit()
    await db.refresh(product)
    
    return {
        "id": str(product.id),
        "name": product.name,
        "brand": product.brand,
        "category": product.category,
        "price": product.base_price,
        "image_urls": product.image_urls,
        "sizes": sizes,
        "variants": [
            {"id": str(v.id), "size": v.size, "garment_image_url": v.garment_image_url}
            for v in variants
        ]
    }

@router.get("/{id}", response_model=ProductResponse)
async def get_product(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).options(selectinload(Product.variants)).filter(Product.id == id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
