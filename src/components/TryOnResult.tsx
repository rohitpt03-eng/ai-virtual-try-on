"use client";

import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { Download } from 'lucide-react';
import { Button } from './ui/Button';

interface TryOnResultProps {
  originalImage: string;
  resultImage: string;
}

export function TryOnResult({ originalImage, resultImage }: TryOnResultProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch(resultImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tryon-result.jpg';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed', error);
    }
  };

  return (
    <div className="relative w-full">
      <ReactCompareSlider
        itemOne={<ReactCompareSliderImage src={originalImage} alt="Original" />}
        itemTwo={<ReactCompareSliderImage src={resultImage} alt="Try-On Result" />}
        className="w-full h-auto aspect-[3/4] md:aspect-auto md:h-[600px] object-cover bg-slate-950"
      />
      <div className="absolute top-4 right-4 z-10">
        <Button size="icon" onClick={handleDownload} title="Download Result" className="shadow-lg">
          <Download className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}