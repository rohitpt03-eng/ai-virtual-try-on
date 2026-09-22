from fastapi import APIRouter
from app.api.v1 import auth, upload, products, measurements, tryon

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(upload.router)
api_router.include_router(products.router)
api_router.include_router(measurements.router)
api_router.include_router(tryon.router)
