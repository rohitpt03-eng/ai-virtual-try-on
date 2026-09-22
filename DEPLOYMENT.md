# 🚀 Live Deployment Guide — AI Virtual Try-On Platform

Yeh guide follow karke aap is project ko 100% live kar sakte hain (Internet par accessible link ke saath).

---

## ⚡ Option 1: Vercel (Frontend) + Render / Railway (Backend) — *Recommended & Free Tier Available*

Yeh modern architecture best hai aur isme 5 minute lagte hain:

### Step 1: Push Code to GitHub
1. Ek naya private ya public repository banayein GitHub par (e.g. `ai-tryon-platform`).
2. Code push karein:
```bash
cd /Users/rohitkumar/.gemini/antigravity/scratch/ai-tryon-platform
git init
git add .
git commit -m "feat: complete AI virtual try-on platform"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/ai-tryon-platform.git
git push -u origin main
```

---

### Step 2: Deploy Backend on Render (FastAPI + PostgreSQL)
1. [Render.com](https://render.com) par sign up / login karein.
2. **New +** par click karein aur **Blueprint** select karein.
3. Apna GitHub repo connect karein. Render automatically `render.yaml` detect kar lega:
   - **PostgreSQL Database** (Free tier) automatically create hoga.
   - **FastAPI Web Service** automatically build aur run hogi.
4. Environment Variables me apna `FAL_KEY` daalein ([fal.ai](https://fal.ai) se key le sakte hain). Agar key abhi nahi hai, toh automatic realistic demo mode chalega!
5. Deploy hone ke baad aapko Backend URL mil jayega, jaise:
   `https://tryon-api-xxxx.onrender.com`

---

### Step 3: Deploy Frontend on Vercel (Next.js 15)
1. [Vercel.com](https://vercel.com) par login karein.
2. **Add New Project** par click karein aur apna GitHub repo select karein.
3. Settings:
   - **Root Directory**: `apps/web` select karein (Edit button daba ke).
   - **Framework Preset**: Next.js (automatically detected).
4. Environment Variables me add karein:
   - `NEXT_PUBLIC_API_URL` = `https://tryon-api-xxxx.onrender.com` (aapka Render backend URL)
   - `NEXT_PUBLIC_USE_MOCKS` = `false` (ya `true` agar bina backend direct preview karna ho)
5. **Deploy** button click karein!
6. 1 minute me aapka live URL live ho jayega:
   `https://ai-tryon-platform.vercel.app` 🎉

---

## 🐳 Option 2: Single VPS / Cloud Server (Docker Compose)

Agar aapke paas DigitalOcean Droplet, AWS EC2, ya koi bhi Linux VPS hai:

1. Server par Docker aur Docker Compose install karein.
2. Repo clone karein:
```bash
git clone <YOUR_REPO_URL>
cd ai-tryon-platform
```
3. `.env` file set karein:
```bash
cp .env.example .env
# nano .env me FAL_KEY daalein
```
4. Single command se all services (Web + API + Celery + DB + Redis) run karein:
```bash
docker compose up -d --build
```
5. Website live ho jayegi:
   - Frontend: `http://<SERVER_IP>:3000`
   - API Docs: `http://<SERVER_IP>:8000/docs`
   - Nginx ya Caddy se domain map kar sakte hain (e.g. `tryon.yourdomain.com`).

---

## 💻 Local Testing (Right Now on your Mac)

Local run karne ke liye ek command kaafi hai:

```bash
cd /Users/rohitkumar/.gemini/antigravity/scratch/ai-tryon-platform
./start.sh
```

Browser me open karein: **http://localhost:3000**
- Photo upload karein
- Quick-try clothing sample pick karein ya kisi bhi site ka link paste karein
- Body measurements aur fit preference (Tight / Regular / Loose) enter karein
- AI Try-On preview aur Size & Fit recommendation dekhein!
