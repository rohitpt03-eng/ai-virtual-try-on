import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
}

const steps = [
  { num: 1, label: "Upload" },
  { num: 2, label: "Clothing" },
  { num: 3, label: "Measurements" },
  { num: 4, label: "Result" },
];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-800 -z-10"></div>
        
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary -z-10 transition-all duration-500"
          style={{ width: `${((Math.min(currentStep, 4) - 1) / 3) * 100}%` }}
        ></div>

        {steps.map((step) => {
          const isCompleted = currentStep > step.num;
          const isCurrent = currentStep === step.num;
          
          return (
            <div key={step.num} className="flex flex-col items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors duration-300
                  ${isCompleted ? 'bg-primary border-primary text-white' : 
                    isCurrent ? 'bg-slate-900 border-primary text-primary' : 
                    'bg-slate-900 border-slate-800 text-slate-500'}`}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : step.num}
              </div>
              <span className={`mt-2 text-xs font-medium absolute -bottom-6 transition-colors duration-300
                ${isCurrent || isCompleted ? 'text-slate-200' : 'text-slate-600'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}