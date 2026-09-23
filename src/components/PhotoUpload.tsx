"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useWizardStore } from "@/store/wizard-store";
import { apiClient } from "@/lib/api-client";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "./ui/Button";

interface PhotoUploadProps {
  onUploadComplete: () => void;
}

export default function PhotoUpload({ onUploadComplete }: PhotoUploadProps) {
  const { setPhoto, setPhotoId } = useWizardStore();
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit.");
      return;
    }

    setPreview(URL.createObjectURL(file));
    setError(null);
    setIsUploading(true);

    try {
      const res = await apiClient.uploadPhoto(file);
      setPhoto(file);
      setPhotoId(res.id);
      setValidationResult(res.validation);
    } catch (err) {
      setError("Failed to upload photo.");
    } finally {
      setIsUploading(false);
    }
  }, [setPhoto, setPhotoId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 1
  });

  return (
    <div className="w-full">
      {!preview ? (
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-slate-700 hover:border-slate-500 bg-slate-900/50'}`}
        >
          <input {...getInputProps()} />
          <UploadCloud className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <p className="text-lg font-medium mb-2">Drag & drop your photo here</p>
          <p className="text-sm text-slate-500">Supports JPG, PNG, WEBP up to 10MB</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="relative w-64 h-96 rounded-xl overflow-hidden border border-slate-800 mb-6 bg-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            {isUploading && (
              <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center text-red-400 bg-red-400/10 px-4 py-2 rounded-lg mb-6">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>{error}</span>
            </div>
          )}

          {validationResult && !isUploading && (
            <div className="w-full max-w-sm mb-6">
              {validationResult.bodyDetected ? (
                <div className="flex items-center text-emerald-400 bg-emerald-400/10 px-4 py-3 rounded-lg border border-emerald-400/20">
                  <CheckCircle2 className="w-5 h-5 mr-3 shrink-0" />
                  <span className="text-sm">Body detected successfully. Good to go!</span>
                </div>
              ) : (
                <div className="flex items-center text-yellow-400 bg-yellow-400/10 px-4 py-3 rounded-lg border border-yellow-400/20">
                  <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
                  <span className="text-sm">Body detection low confidence. You might want to upload a clearer photo.</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => { setPreview(null); setValidationResult(null); }}>
              Change Photo
            </Button>
            {validationResult && <Button onClick={onUploadComplete}>Continue</Button>}
          </div>
        </div>
      )}
    </div>
  );
}