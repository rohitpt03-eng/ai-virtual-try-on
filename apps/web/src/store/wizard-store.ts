import { create } from 'zustand';

interface MeasurementData {
  height: number;
  weight: number;
  chest: number;
  waist: number;
  hip: number;
  inseam: number;
  fitPreference: "tight" | "regular" | "loose";
}

interface ProductData {
  id: string;
  name: string;
  brand: string;
  price: string;
  imageUrl: string;
  availableSizes: string[];
}

interface WizardState {
  currentStep: number;
  photoFile: File | null;
  photoId: string | null;
  productData: ProductData | null;
  measurements: MeasurementData | null;
  tryOnSessionId: string | null;
  
  setStep: (step: number) => void;
  setPhoto: (file: File) => void;
  setPhotoId: (id: string) => void;
  setProduct: (data: ProductData) => void;
  setMeasurements: (data: MeasurementData) => void;
  setTryOnSessionId: (id: string) => void;
  reset: () => void;
}

export const useWizardStore = create<WizardState>((set) => ({
  currentStep: 1,
  photoFile: null,
  photoId: null,
  productData: null,
  measurements: null,
  tryOnSessionId: null,

  setStep: (step) => set({ currentStep: step }),
  setPhoto: (file) => set({ photoFile: file }),
  setPhotoId: (id) => set({ photoId: id }),
  setProduct: (data) => set({ productData: data }),
  setMeasurements: (data) => set({ measurements: data }),
  setTryOnSessionId: (id) => set({ tryOnSessionId: id }),
  reset: () => set({
    currentStep: 1,
    photoFile: null,
    photoId: null,
    productData: null,
    measurements: null,
    tryOnSessionId: null,
  }),
}));
