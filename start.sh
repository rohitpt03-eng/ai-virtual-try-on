#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "    🚀 Starting AI Virtual Try-On Platform (Next.js 15)"
echo "=========================================================="

cd "$(dirname "$0")/apps/web"

if [ ! -d "node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  npm install
fi

echo "🌐 Starting web application on http://localhost:3000..."
echo "💡 Demo & try-on simulation mode is enabled out of the box!"
echo "   (Open http://localhost:3000 in your browser)"
echo ""

npm run dev
