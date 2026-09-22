"use client";

import { Card } from "./ui/Card";
import { CheckCircle2, AlertTriangle, ArrowDownToLine } from "lucide-react";

interface FitAnalysis {
  recommendedSize: string;
  overallScore: number;
  dimensions: {
    name: string;
    status: "good" | "tight" | "loose" | "slightly_tight" | "slightly_loose";
  }[];
}

interface SizeFitCardProps {
  fitAnalysis: FitAnalysis;
}

export function SizeFitCard({ fitAnalysis }: SizeFitCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'tight': 
      case 'slightly_tight': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'loose':
      case 'slightly_loose': return <ArrowDownToLine className="w-4 h-4 text-blue-500" />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-800">
        <div>
          <h3 className="text-sm text-slate-400 font-medium mb-1">Recommended Size</h3>
          <div className="text-3xl font-bold text-primary">{fitAnalysis.recommendedSize}</div>
        </div>
        <div className="text-right">
          <h3 className="text-sm text-slate-400 font-medium mb-1">Fit Score</h3>
          <div className="text-2xl font-bold">{fitAnalysis.overallScore}/100</div>
        </div>
      </div>

      <h4 className="text-sm font-semibold mb-4 text-slate-300">Detailed Analysis</h4>
      <div className="space-y-3">
        {fitAnalysis.dimensions.map((dim, i) => (
          <div key={i} className="flex items-center justify-between bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
            <span className="text-sm font-medium text-slate-300">{dim.name}</span>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium 
                ${dim.status === 'good' ? 'text-emerald-400' : 
                  dim.status.includes('tight') ? 'text-amber-400' : 'text-blue-400'}`}
              >
                {getStatusText(dim.status)}
              </span>
              {getStatusIcon(dim.status)}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-slate-800">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Too Tight</span>
          <span>Perfect</span>
          <span>Too Loose</span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
          <div className="h-full bg-amber-500" style={{ width: '33%' }}></div>
          <div className="h-full bg-emerald-500" style={{ width: '34%' }}></div>
          <div className="h-full bg-blue-500" style={{ width: '33%' }}></div>
        </div>
      </div>
    </Card>
  );
}