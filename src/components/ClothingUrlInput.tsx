"use client";

import { useState } from "react";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { apiClient } from "@/lib/api-client";
import { useWizardStore } from "@/store/wizard-store";
import { LinkIcon, Loader2, AlertCircle } from "lucide-react";

interface ClothingUrlInputProps {
  onExtractComplete: () => void;
}

export default function ClothingUrlInput({ onExtractComplete }: ClothingUrlInputProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { productData, setProduct } = useWizardStore();

  const handleExtract = async () => {
    if (!url) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.extractProduct(url);
      setProduct(data);
    } catch (err) {
      setError("Failed to extract product from URL. Please check the URL and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <Input 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste product URL (e.g., ASOS, Zara, Nike)"
            className="pl-10"
            disabled={isLoading}
          />
        </div>
        <Button onClick={handleExtract} disabled={!url || isLoading} className="min-w-[120px]">
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Extract"}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6 text-xs text-slate-400">
        <span className="text-slate-500">Quick Try Samples:</span>
        <button
          type="button"
          onClick={() => {
            setUrl("https://www.zara.com/sample-classic-linen-shirt");
          }}
          className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          👔 Linen Shirt
        </button>
        <button
          type="button"
          onClick={() => {
            setUrl("https://www.zara.com/sample-relaxed-oversized-hoodie");
          }}
          className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          🧥 Classic Hoodie
        </button>
        <button
          type="button"
          onClick={() => {
            setUrl("https://www.zara.com/sample-floral-summer-midi-dress");
          }}
          className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          👗 Summer Dress
        </button>
      </div>

      {error && (
        <div className="flex items-start text-red-400 bg-red-400/10 px-4 py-3 rounded-lg mb-6">
          <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {productData && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex gap-6 mt-6 animate-in fade-in">
          <div className="w-32 h-40 bg-slate-800 rounded-lg overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {productData.imageUrl ? <img src={productData.imageUrl} alt={productData.name} className="w-full h-full object-cover" /> : null}
          </div>
          <div className="flex-1 py-2">
            <h3 className="font-semibold text-lg mb-1">{productData.name}</h3>
            <p className="text-slate-400 text-sm mb-4">{productData.brand} • {productData.price}</p>
            
            <div className="mb-4">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Available Sizes</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {productData.availableSizes.map((size: string) => (
                  <span key={size} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs border border-slate-700">
                    {size}
                  </span>
                ))}
              </div>
            </div>
            
            <Button className="mt-2 w-full sm:w-auto" onClick={onExtractComplete}>Use This Item</Button>
          </div>
        </div>
      )}
    </div>
  );
}