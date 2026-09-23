import os
import uuid
from PIL import Image

def resize_image(path: str, max_size: int = 1024):
    with Image.open(path) as img:
        img.thumbnail((max_size, max_size))
        img.save(path)

def validate_image(path: str) -> bool:
    try:
        with Image.open(path) as img:
            img.verify()
        return True
    except Exception:
        return False
        
def save_upload(file_bytes: bytes, upload_dir: str, file_ext: str) -> str:
    os.makedirs(upload_dir, exist_ok=True)
    filename = f"{uuid.uuid4()}{file_ext}"
    filepath = os.path.join(upload_dir, filename)
    with open(filepath, 'wb') as f:
        f.write(file_bytes)
    return filepath
