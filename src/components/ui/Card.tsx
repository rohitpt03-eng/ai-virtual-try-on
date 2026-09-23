import * as React from "react";

export function Card({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl border border-slate-800 bg-slate-900 text-slate-50 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
