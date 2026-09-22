import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import Dict, Any
from app.core.config import settings

from app.services.body_validator import validate_body_photo

router = APIRouter(prefix="/upload", tags=["upload"])

@router.post("/photo")
async def upload_photo(file: UploadFile = File(...)) -> Dict[str, Any]:
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")
        
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_ext = os.path.splitext(file.filename)[1] or ".jpg"
    photo_id = str(uuid.uuid4())
    file_name = f"{photo_id}{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, file_name)
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
        
    validation = validate_body_photo(file_path)
    
    if not validation.get("is_valid", True):
        # Clean up invalid file
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail=validation.get("error_message") or "Body validation failed")
        
    return {
        "photo_id": file_name,
        "is_valid": True,
        "validation": validation
    }
