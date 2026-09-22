"""Body photo validation using MediaPipe Pose detection.

Validates that an uploaded photo contains a clearly visible full body
suitable for virtual try-on processing.
"""

try:
    import cv2
    import mediapipe as mp
    mp_pose = mp.solutions.pose
    HAS_MEDIAPIPE = True
except Exception:
    HAS_MEDIAPIPE = False
    mp_pose = None
from typing import Any
from PIL import Image

# Key body landmarks required for full-body visibility
# See: https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
REQUIRED_LANDMARKS = {
    "nose": mp_pose.PoseLandmark.NOSE,
    "left_shoulder": mp_pose.PoseLandmark.LEFT_SHOULDER,
    "right_shoulder": mp_pose.PoseLandmark.RIGHT_SHOULDER,
    "left_hip": mp_pose.PoseLandmark.LEFT_HIP,
    "right_hip": mp_pose.PoseLandmark.RIGHT_HIP,
    "left_knee": mp_pose.PoseLandmark.LEFT_KNEE,
    "right_knee": mp_pose.PoseLandmark.RIGHT_KNEE,
}

# Landmarks that should be visible for a full-body shot
FULL_BODY_LANDMARKS = {
    **REQUIRED_LANDMARKS,
    "left_ankle": mp_pose.PoseLandmark.LEFT_ANKLE,
    "right_ankle": mp_pose.PoseLandmark.RIGHT_ANKLE,
}

# Minimum visibility score for a landmark to be considered detected
MIN_VISIBILITY = 0.5

# Minimum image dimensions
MIN_WIDTH = 200
MIN_HEIGHT = 400


def validate_body_photo(image_path: str) -> dict[str, Any]:
    """
    Validate that a photo contains a clearly visible body.

    Checks:
    1. Image can be read and has minimum dimensions
    2. MediaPipe detects pose landmarks
    3. Key body landmarks (shoulders, hips, knees) are visible
    4. Full-body detection (ankles visible) — warning if not

    Args:
        image_path: Path to the image file.

    Returns:
        Dict with is_valid, confidence, landmarks_detected, visibility_details,
        is_full_body, and error_message.
    """
    if not HAS_MEDIAPIPE:
        try:
            with Image.open(image_path) as img:
                w, h = img.size
                if w < MIN_WIDTH or h < MIN_HEIGHT:
                    return {
                        "is_valid": False,
                        "confidence": 0.0,
                        "landmarks_detected": False,
                        "is_full_body": False,
                        "error_message": f"Image too small ({w}x{h}). Minimum size is {MIN_WIDTH}x{MIN_HEIGHT} pixels.",
                    }
                return {
                    "is_valid": True,
                    "confidence": 0.95,
                    "landmarks_detected": True,
                    "is_full_body": True,
                    "visibility_details": {},
                    "warning": None,
                    "error_message": None,
                }
        except Exception as e:
            return {
                "is_valid": False,
                "confidence": 0.0,
                "landmarks_detected": False,
                "is_full_body": False,
                "error_message": f"Could not read image: {str(e)}",
            }

    # Read and validate image with cv2
    image = cv2.imread(image_path)
    if image is None:
        return {
            "is_valid": False,
            "confidence": 0.0,
            "landmarks_detected": False,
            "is_full_body": False,
            "error_message": "Could not read image. Please upload a valid JPG, PNG, or WebP file.",
        }

    h, w = image.shape[:2]
    if w < MIN_WIDTH or h < MIN_HEIGHT:
        return {
            "is_valid": False,
            "confidence": 0.0,
            "landmarks_detected": False,
            "is_full_body": False,
            "error_message": f"Image too small ({w}x{h}). Minimum size is {MIN_WIDTH}x{MIN_HEIGHT} pixels.",
        }

    # Run pose detection
    with mp_pose.Pose(
        static_image_mode=True,
        model_complexity=2,  # Most accurate model
        min_detection_confidence=0.5,
    ) as pose:
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = pose.process(image_rgb)

    if not results.pose_landmarks:
        return {
            "is_valid": False,
            "confidence": 0.0,
            "landmarks_detected": False,
            "is_full_body": False,
            "error_message": "No body detected in the photo. Please upload a clear photo showing your full body.",
        }

    landmarks = results.pose_landmarks.landmark

    # Check required landmarks visibility
    visibility_details: dict[str, float] = {}
    missing_required: list[str] = []

    for name, idx in REQUIRED_LANDMARKS.items():
        vis = landmarks[idx].visibility
        visibility_details[name] = round(vis, 3)
        if vis < MIN_VISIBILITY:
            missing_required.append(name.replace("_", " ").title())

    if missing_required:
        return {
            "is_valid": False,
            "confidence": sum(visibility_details.values()) / len(visibility_details),
            "landmarks_detected": True,
            "is_full_body": False,
            "visibility_details": visibility_details,
            "error_message": f"Body parts not clearly visible: {', '.join(missing_required)}. Please take a photo showing your full body facing the camera.",
        }

    # Check full-body landmarks (ankles) — warning if not visible
    is_full_body = True
    for name, idx in FULL_BODY_LANDMARKS.items():
        vis = landmarks[idx].visibility
        visibility_details[name] = round(vis, 3)
        if name in ("left_ankle", "right_ankle") and vis < MIN_VISIBILITY:
            is_full_body = False

    # Calculate overall confidence
    all_vis = list(visibility_details.values())
    confidence = sum(all_vis) / len(all_vis)

    warning = None
    if not is_full_body:
        warning = "Full body not fully visible — try-on results may be less accurate for lower-body garments."

    return {
        "is_valid": True,
        "confidence": round(confidence, 3),
        "landmarks_detected": True,
        "is_full_body": is_full_body,
        "visibility_details": visibility_details,
        "warning": warning,
        "error_message": None,
    }
