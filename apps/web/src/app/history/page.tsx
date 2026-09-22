"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await apiClient.getTryOnHistory();
        setHistory(data);
      } catch (error) {
        console.error("Failed to fetch history", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full p-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Try-On History</h1>
      
      {history.length === 0 ? (
        <div className="text-center py-24 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
          <p className="text-slate-400 mb-4">No try-on sessions found.</p>
          <Link href="/try-on" className="text-primary hover:underline">Start your first try-on</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {history.map((session) => (
            <Link href={`/results/${session.id}`} key={session.id}>
              <Card className="overflow-hidden hover:border-primary/50 transition-colors group cursor-pointer h-full flex flex-col">
                <div className="relative aspect-[3/4] w-full bg-slate-800">
                  <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                    Image {session.id}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-end bg-slate-900">
                  <p className="text-sm font-medium text-slate-300">Session #{session.id.substring(0, 6)}</p>
                  <p className="text-xs text-slate-500">{new Date(session.createdAt).toLocaleDateString()}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}