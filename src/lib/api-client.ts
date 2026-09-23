/**
 * API client for communicating with the FastAPI backend.
 *
 * Uses the real backend when NEXT_PUBLIC_API_URL is set.
 * Falls back to mock data when the backend is unavailable (for frontend dev).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

// ---------- Types ----------

export interface UploadPhotoResponse {
  id: string;
  validation: {
    bodyDetected: boolean;
    isFullBody: boolean;
    confidence: number;
    warning?: string;
    errorMessage?: string;
  };
}

export interface ProductData {
  id: string;
  name: string;
  brand: string;
  price: string;
  imageUrl: string;
  availableSizes: string[];
}

export interface TryOnStartResponse {
  sessionId: string;
}

export interface TryOnStatusResponse {
  status: "pending" | "processing" | "completed" | "failed";
  progressMessage?: string;
}

export interface FitDimension {
  name: string;
  status: "good" | "tight" | "loose" | "slightly_tight" | "slightly_loose";
  userValue?: number;
  garmentValue?: number;
}

export interface TryOnResult {
  id: string;
  originalImage: string;
  resultImage: string;
  fitAnalysis: {
    recommendedSize: string;
    overallScore: number;
    confidence: number;
    dimensions: FitDimension[];
  };
  processingTimeMs?: number;
}

export interface TryOnHistoryItem {
  id: string;
  productName?: string;
  thumbnailUrl?: string;
  status: string;
  createdAt: string;
}

export interface Measurements {
  heightCm: number;
  weightKg?: number;
  chestCm: number;
  waistCm: number;
  hipCm: number;
  inseamCm?: number;
  fitPreference: "tight" | "regular" | "loose";
}

// ---------- Helper ----------

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}/api/v1${path}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `API error: ${res.status}`);
  }

  return res.json();
}

// ---------- Mock Data ----------

const mocks = {
  uploadPhoto: async (): Promise<UploadPhotoResponse> => {
    await delay(1500);
    return {
      id: `photo_${randomId()}`,
      validation: { bodyDetected: true, isFullBody: true, confidence: 0.95 },
    };
  },

  extractProduct: async (): Promise<ProductData> => {
    await delay(1200);
    return {
      id: `prod_${randomId()}`,
      name: "Classic Cotton T-Shirt",
      brand: "Example Brand",
      price: "$29.99",
      imageUrl:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80",
      availableSizes: ["S", "M", "L", "XL"],
    };
  },

  startTryOn: async (): Promise<TryOnStartResponse> => {
    await delay(800);
    return { sessionId: `sess_${randomId()}` };
  },

  getTryOnStatus: async (): Promise<TryOnStatusResponse> => {
    await delay(500);
    return { status: "completed" };
  },

  getTryOnResult: async (sessionId: string): Promise<TryOnResult> => {
    await delay(500);
    return {
      id: sessionId,
      originalImage:
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80",
      resultImage:
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80",
      fitAnalysis: {
        recommendedSize: "M",
        overallScore: 92,
        confidence: 0.87,
        dimensions: [
          { name: "Chest", status: "good" },
          { name: "Waist", status: "slightly_loose" },
          { name: "Length", status: "good" },
          { name: "Sleeves", status: "good" },
        ],
      },
      processingTimeMs: 4200,
    };
  },

  getTryOnHistory: async (): Promise<TryOnHistoryItem[]> => {
    await delay(800);
    return [
      {
        id: "sess_1",
        productName: "Classic T-Shirt",
        status: "completed",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: "sess_2",
        productName: "Slim Fit Jeans",
        status: "completed",
        createdAt: new Date(Date.now() - 172800000).toISOString(),
      },
    ];
  },
};

// ---------- API Client ----------

export const apiClient = {
  uploadPhoto: async (file: File): Promise<UploadPhotoResponse> => {
    if (USE_MOCKS) return mocks.uploadPhoto();

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/api/v1/upload/photo`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || "Upload failed");
    }

    const data = await res.json();
    return {
      id: data.photo_id,
      validation: {
        bodyDetected: data.validation?.is_valid ?? true,
        isFullBody: data.validation?.is_full_body ?? false,
        confidence: data.validation?.confidence ?? 0,
        warning: data.validation?.warning,
        errorMessage: data.validation?.error_message,
      },
    };
  },

  extractProduct: async (url: string): Promise<ProductData> => {
    if (USE_MOCKS) return mocks.extractProduct();

    const data = await apiFetch<any>("/products/extract", {
      method: "POST",
      body: JSON.stringify({ url }),
    });

    return {
      id: data.id,
      name: data.name,
      brand: data.brand,
      price: data.price ? `$${data.price}` : "N/A",
      imageUrl: data.image_urls?.[0] || "",
      availableSizes: data.sizes || [],
    };
  },

  saveMeasurements: async (
    measurements: Measurements
  ): Promise<{ id: string }> => {
    return apiFetch("/measurements", {
      method: "POST",
      body: JSON.stringify({
        height_cm: measurements.heightCm,
        weight_kg: measurements.weightKg,
        chest_cm: measurements.chestCm,
        waist_cm: measurements.waistCm,
        hip_cm: measurements.hipCm,
        inseam_cm: measurements.inseamCm,
        fit_preference: measurements.fitPreference,
      }),
    });
  },

  startTryOn: async (data: {
    photoId: string;
    productId: string;
    measurements: Measurements;
  }): Promise<TryOnStartResponse> => {
    if (USE_MOCKS) return mocks.startTryOn();

    const result = await apiFetch<any>("/tryon", {
      method: "POST",
      body: JSON.stringify({
        photo_id: data.photoId,
        product_variant_id: data.productId,
        measurement_data: {
          height_cm: data.measurements.heightCm,
          weight_kg: data.measurements.weightKg,
          chest_cm: data.measurements.chestCm,
          waist_cm: data.measurements.waistCm,
          hip_cm: data.measurements.hipCm,
          inseam_cm: data.measurements.inseamCm,
          fit_preference: data.measurements.fitPreference,
        },
      }),
    });

    return { sessionId: result.id || result.session_id };
  },

  getTryOnStatus: async (sessionId: string): Promise<TryOnStatusResponse> => {
    if (USE_MOCKS) return mocks.getTryOnStatus();

    return apiFetch(`/tryon/${sessionId}/status`);
  },

  getTryOnResult: async (sessionId: string): Promise<TryOnResult> => {
    if (USE_MOCKS) return mocks.getTryOnResult(sessionId);

    const data = await apiFetch<any>(`/tryon/${sessionId}/result`);

    return {
      id: data.id,
      originalImage: data.input_image_url,
      resultImage: data.output_image_url,
      fitAnalysis: {
        recommendedSize:
          data.size_recommendation?.recommended_size || "M",
        overallScore: Math.round(
          (data.size_recommendation?.overall_fit_score || 0.8) * 100
        ),
        confidence: data.size_recommendation?.confidence || 0.7,
        dimensions: (data.size_recommendation?.fit_details || []).map(
          (d: any) => ({
            name: d.dimension,
            status: mapFitLabel(d.fit_label),
            userValue: d.user_value_cm,
            garmentValue: d.garment_value_cm,
          })
        ),
      },
      processingTimeMs: data.processing_time_ms,
    };
  },

  getTryOnHistory: async (): Promise<TryOnHistoryItem[]> => {
    if (USE_MOCKS) return mocks.getTryOnHistory();

    const data = await apiFetch<any[]>("/tryon/history");
    return data.map((item) => ({
      id: item.id,
      productName: item.product_name,
      thumbnailUrl: item.output_image_url || item.input_image_url,
      status: item.status,
      createdAt: item.created_at,
    }));
  },
};

// ---------- Utilities ----------

function randomId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mapFitLabel(
  label: string
): "good" | "tight" | "loose" | "slightly_tight" | "slightly_loose" {
  const map: Record<string, any> = {
    Regular: "good",
    Tight: "slightly_tight",
    "Too Tight": "tight",
    Loose: "slightly_loose",
    "Too Loose": "loose",
  };
  return map[label] || "good";
}
