"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePolling } from "@/hooks/usePolling";
import { apiClient } from "@/lib/api-client";
import { TryOnResult as TryOnResultComponent } from "@/components/TryOnResult";
import { SizeFitCard } from "@/components/SizeFitCard";
import { Button } from "@/components/ui/Button";
import { Loader2, ArrowLeft } from "lucide-react";

export default function ResultPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    const data = await apiClient.getTryOnStatus(id);
    if (data.status === 'completed') {
      const resultData = await apiClient.getTryOnResult(id);
      setResult(resultData);
      return true; // stop polling
    } else if (data.status === 'failed') {
      setError("Try-on processing failed.");
      return true;
    }
    return false; // continue polling
  };

  const { isPolling } = usePolling(fetchStatus, 3000, 20);

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl text-red-500 mb-4">{error}</h2>
        <Button onClick={() => router.push('/try-on')}>Try Again</Button>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
        <h2 className="text-3xl font-bold mb-2">Generating Your Result</h2>
        <p className="text-slate-400">Our AI is rendering the final image...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full p-6 py-8">
      <Button variant="ghost" onClick={() => router.push('/history')} className="mb-6 -ml-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to History
      </Button>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <TryOnResultComponent 
              originalImage={result.originalImage} 
              resultImage={result.resultImage} 
            />
          </div>
        </div>
        
        <div className="space-y-6">
          <SizeFitCard fitAnalysis={result.fitAnalysis} />
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Product Details</h3>
            <p className="text-sm text-slate-400 mb-4">You are trying on a clothing item from the extracted URL.</p>
            <Button className="w-full">Shop This Look</Button>
          </div>
        </div>
      </div>
    </div>
  );
}