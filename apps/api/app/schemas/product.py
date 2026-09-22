import uuid
from pydantic import BaseModel, HttpUrl, ConfigDict

class ProductExtractRequest(BaseModel):
    url: str

class ProductVariantResponse(BaseModel):
    id: uuid.UUID
    size: str | None = None
    color: str | None = None
    garment_image_url: str | None = None
    stock_count: int | None = None
    
    model_config = ConfigDict(from_attributes=True)

class ProductResponse(BaseModel):
    id: uuid.UUID
    name: str
    brand: str | None = None
    category: str | None = None
    description: str | None = None
    base_price: float | None = None
    image_urls: list[str] = []
    variants: list[ProductVariantResponse] = []
    
    model_config = ConfigDict(from_attributes=True)
