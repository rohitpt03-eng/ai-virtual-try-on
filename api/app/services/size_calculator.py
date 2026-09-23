"""Size recommendation engine using weighted Euclidean distance."""

import math
from typing import Any


# Weights for each dimension (higher = more important for fit)
DIMENSION_WEIGHTS: dict[str, float] = {
    "chest_cm": 1.5,
    "waist_cm": 1.3,
    "hip_cm": 1.2,
    "shoulder_cm": 1.0,
    "inseam_cm": 0.8,
    "length_cm": 0.7,
}

# Fit preference multipliers applied to user measurements
FIT_MULTIPLIERS: dict[str, float] = {
    "tight": 0.97,
    "regular": 1.00,
    "loose": 1.05,
}

# Thresholds for fit labels (percentage difference from garment dimension)
FIT_THRESHOLDS: list[tuple[float, str]] = [
    (-0.10, "Too Tight"),
    (-0.04, "Tight"),
    (0.04, "Regular"),
    (0.10, "Loose"),
    (float("inf"), "Too Loose"),
]

# Default size chart (used when scraping doesn't extract one)
DEFAULT_SIZE_CHART: dict[str, dict[str, float]] = {
    "XS": {"chest_cm": 84, "waist_cm": 68, "hip_cm": 88, "shoulder_cm": 40, "length_cm": 66},
    "S":  {"chest_cm": 90, "waist_cm": 74, "hip_cm": 94, "shoulder_cm": 42, "length_cm": 68},
    "M":  {"chest_cm": 96, "waist_cm": 80, "hip_cm": 100, "shoulder_cm": 44, "length_cm": 70},
    "L":  {"chest_cm": 104, "waist_cm": 88, "hip_cm": 108, "shoulder_cm": 47, "length_cm": 73},
    "XL": {"chest_cm": 112, "waist_cm": 96, "hip_cm": 116, "shoulder_cm": 50, "length_cm": 75},
    "XXL": {"chest_cm": 120, "waist_cm": 104, "hip_cm": 124, "shoulder_cm": 53, "length_cm": 77},
}


def _classify_fit(user_val: float, garment_val: float) -> str:
    """Classify how a single dimension fits based on percentage difference."""
    if garment_val == 0:
        return "Regular"
    pct_diff = (garment_val - user_val) / garment_val
    for threshold, label in FIT_THRESHOLDS:
        if pct_diff <= threshold:
            return label
    return "Regular"


def _fit_score(label: str) -> float:
    """Convert fit label to a numeric score (1.0 = perfect, 0.0 = worst)."""
    scores = {
        "Too Tight": 0.2,
        "Tight": 0.6,
        "Regular": 1.0,
        "Loose": 0.7,
        "Too Loose": 0.3,
    }
    return scores.get(label, 0.5)


def recommend_size(
    user_measurements: dict[str, float],
    size_chart: dict[str, dict[str, float]] | None = None,
    fit_preference: str = "regular",
) -> dict[str, Any]:
    """
    Recommend the best clothing size based on user measurements.

    Uses weighted Euclidean distance to find the closest size,
    adjusted by the user's fit preference (tight/regular/loose).

    Args:
        user_measurements: Dict of dimension name to value in cm.
            Expected keys: chest_cm, waist_cm, hip_cm, shoulder_cm, inseam_cm
        size_chart: Dict mapping size label to dimension values.
            Falls back to DEFAULT_SIZE_CHART if None.
        fit_preference: One of "tight", "regular", "loose".

    Returns:
        Dict with recommended_size, confidence, fit_details, and overall_fit_score.
    """
    if size_chart is None:
        size_chart = DEFAULT_SIZE_CHART

    multiplier = FIT_MULTIPLIERS.get(fit_preference, 1.0)

    # Adjust user measurements by fit preference
    adjusted_user: dict[str, float] = {
        k: v * multiplier for k, v in user_measurements.items()
    }

    best_size: str | None = None
    min_distance = float("inf")
    all_scores: dict[str, float] = {}

    for size_label, dimensions in size_chart.items():
        weighted_sum = 0.0
        matched_dims = 0

        for dim, garment_val in dimensions.items():
            user_val = adjusted_user.get(dim)
            if user_val is not None:
                weight = DIMENSION_WEIGHTS.get(dim, 1.0)
                diff = (user_val - garment_val) ** 2
                weighted_sum += weight * diff
                matched_dims += 1

        if matched_dims > 0:
            distance = math.sqrt(weighted_sum / matched_dims)
            all_scores[size_label] = distance
            if distance < min_distance:
                min_distance = distance
                best_size = size_label

    if best_size is None:
        best_size = "M"

    # Compute per-dimension fit details for the recommended size
    recommended_dims = size_chart.get(best_size, {})
    fit_details: list[dict[str, Any]] = []

    for dim, garment_val in recommended_dims.items():
        user_val = user_measurements.get(dim)
        if user_val is not None:
            label = _classify_fit(user_val * multiplier, garment_val)
            fit_details.append({
                "dimension": dim.replace("_cm", "").replace("_", " ").title(),
                "user_value_cm": round(user_val, 1),
                "garment_value_cm": round(garment_val, 1),
                "fit_label": label,
                "fit_score": _fit_score(label),
            })

    # Compute confidence: based on how much better the best is vs. second-best
    sorted_scores = sorted(all_scores.values())
    if len(sorted_scores) >= 2 and sorted_scores[0] > 0:
        separation = (sorted_scores[1] - sorted_scores[0]) / sorted_scores[1]
        confidence = min(0.95, 0.6 + separation * 0.5)
    else:
        confidence = 0.7

    # Overall fit score = weighted average of per-dimension scores
    if fit_details:
        weights = [DIMENSION_WEIGHTS.get(d["dimension"].lower().replace(" ", "_") + "_cm", 1.0) for d in fit_details]
        overall_score = sum(d["fit_score"] * w for d, w in zip(fit_details, weights)) / sum(weights)
    else:
        overall_score = 0.7

    return {
        "recommended_size": best_size,
        "confidence": round(confidence, 2),
        "overall_fit_score": round(overall_score, 2),
        "fit_preference": fit_preference,
        "fit_details": fit_details,
        "all_sizes_distance": {k: round(v, 2) for k, v in all_scores.items()},
    }
