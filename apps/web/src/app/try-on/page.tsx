"use client";

import { useWizardStore } from "@/store/wizard-store";
import { StepIndicator } from "@/components/ui/StepIndicator";
import PhotoUpload from "@/components/PhotoUpload";
import ClothingUrlInput from "@/components/ClothingUrlInput";
import MeasurementForm from "@/components/MeasurementForm";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Loader2 } from "lucide-react";

export default function TryOnWizard() {
  const { currentStep, setStep, photoId, productData, measurements, setTryOnSessionId } = useWizardStore();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!photoId && currentStep > 1) {
      setStep(1);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < 3) setStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    const currentMeasurements = useWizardStore.getState().measurements || measurements;
    if (!photoId || !productData || !currentMeasurements) return;
    setIsSubmitting(true);
    setStep(4);
    
    try {
      const { sessionId } = await apiClient.startTryOn({
        photoId,
        productId: productData.id,
        measurements: {
          heightCm: currentMeasurements.height,
          weightKg: currentMeasurements.weight,
          chestCm: currentMeasurements.chest,
          waistCm: currentMeasurements.waist,
          hipCm: currentMeasurements.hip,
          inseamCm: currentMeasurements.inseam,
          fitPreference: currentMeasurements.fitPreference,
        },
      });
      setTryOnSessionId(sessionId);
      router.push(`/results/${sessionId}`);
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
      setStep(3);
      alert("Failed to start try-on process. Please try again.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full p-6 py-12">
      <StepIndicator currentStep={currentStep} />
      
      <div className="mt-12 bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        {currentStep === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold mb-6">Upload Your Photo</h2>
            <PhotoUpload onUploadComplete={() => handleNext()} />
          </div>
        )}

        {currentStep === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold mb-6">Select Clothing</h2>
            <ClothingUrlInput onExtractComplete={() => handleNext()} />
          </div>
        )}

        {currentStep === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold mb-6">Your Measurements</h2>
            <MeasurementForm onSubmit={handleSubmit} />
          </div>
        )}

        {currentStep === 4 && (
          <div className="animate-in fade-in duration-500 flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <h2 className="text-2xl font-bold mb-2">Processing Try-On...</h2>
            <p className="text-slate-400 text-center">
              Our AI is analyzing your photo and draping the clothing.<br/>
              This might take a few seconds.
            </p>
          </div>
        )}

        {currentStep > 1 && currentStep < 4 && (
          <div className="mt-8 flex justify-between pt-6 border-t border-slate-800">
            <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
              Back
            </Button>
            {currentStep < 3 && (
              <Button onClick={handleNext} disabled={isSubmitting || (currentStep === 2 && !productData)}>
                Next
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}