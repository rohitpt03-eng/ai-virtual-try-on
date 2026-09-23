"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { useWizardStore } from "@/store/wizard-store";

const measurementSchema = z.object({
  height: z.coerce.number().min(50).max(300),
  weight: z.coerce.number().min(20).max(300),
  chest: z.coerce.number().min(30).max(200),
  waist: z.coerce.number().min(30).max(200),
  hip: z.coerce.number().min(30).max(200),
  inseam: z.coerce.number().min(20).max(150),
  fitPreference: z.enum(["tight", "regular", "loose"])
});

type MeasurementValues = z.infer<typeof measurementSchema>;

interface MeasurementFormProps {
  onSubmit: () => void;
}

export default function MeasurementForm({ onSubmit }: MeasurementFormProps) {
  const { measurements, setMeasurements } = useWizardStore();
  
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<MeasurementValues>({
    resolver: zodResolver(measurementSchema),
    defaultValues: measurements || {
      fitPreference: "regular"
    }
  });

  const fitPref = watch("fitPreference");

  const submitForm = (data: MeasurementValues) => {
    setMeasurements(data);
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit(submitForm)} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Input 
          label="Height (cm)" 
          type="number" 
          {...register("height")} 
          error={errors.height?.message}
        />
        <Input 
          label="Weight (kg)" 
          type="number" 
          {...register("weight")} 
          error={errors.weight?.message}
        />
        <Input 
          label="Chest (cm)" 
          type="number" 
          {...register("chest")} 
          error={errors.chest?.message}
        />
        <Input 
          label="Waist (cm)" 
          type="number" 
          {...register("waist")} 
          error={errors.waist?.message}
        />
        <Input 
          label="Hip (cm)" 
          type="number" 
          {...register("hip")} 
          error={errors.hip?.message}
        />
        <Input 
          label="Inseam (cm)" 
          type="number" 
          {...register("inseam")} 
          error={errors.inseam?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">Fit Preference</label>
        <div className="flex gap-4">
          {(["tight", "regular", "loose"] as const).map((pref) => (
            <div 
              key={pref}
              onClick={() => setValue("fitPreference", pref)}
              className={`flex-1 py-3 text-center rounded-lg border cursor-pointer capitalize transition-colors
                ${fitPref === pref 
                  ? 'bg-primary/20 border-primary text-primary font-medium' 
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}
            >
              {pref}
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <Button type="submit" size="lg" className="w-full sm:w-auto px-8">Start Try-On</Button>
      </div>
    </form>
  );
}