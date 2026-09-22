import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-5xl font-bold mb-6 tracking-tight bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent">
        AI Virtual Try-On Platform
      </h1>
      <p className="text-xl text-slate-400 max-w-2xl mb-12">
        See how clothes fit you before you buy. Upload your photo, provide a product link, and let our AI do the rest.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 text-left w-full max-w-5xl">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <div className="w-12 h-12 bg-purple-900/50 rounded-lg flex items-center justify-center mb-4 text-purple-400 font-bold text-xl">1</div>
          <h3 className="text-lg font-semibold mb-2">Upload Photo</h3>
          <p className="text-slate-400 text-sm">Upload a full-body photo of yourself to serve as the base for the try-on.</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <div className="w-12 h-12 bg-purple-900/50 rounded-lg flex items-center justify-center mb-4 text-purple-400 font-bold text-xl">2</div>
          <h3 className="text-lg font-semibold mb-2">AI Try-On</h3>
          <p className="text-slate-400 text-sm">Our AI seamlessly drapes the selected clothing onto your body.</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <div className="w-12 h-12 bg-purple-900/50 rounded-lg flex items-center justify-center mb-4 text-purple-400 font-bold text-xl">3</div>
          <h3 className="text-lg font-semibold mb-2">Size Recommendation</h3>
          <p className="text-slate-400 text-sm">Get accurate size suggestions based on your measurements and the garment.</p>
        </div>
      </div>

      <Link href="/try-on">
        <Button size="lg" className="text-lg px-8 py-6 rounded-full font-semibold">
          Try It Now
        </Button>
      </Link>
    </div>
  );
}