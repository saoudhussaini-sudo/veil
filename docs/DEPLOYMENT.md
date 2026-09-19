# VEIL — Cloud & Vercel Deployment Guide

This guide explains how to deploy VEIL with its frontend on Vercel and how to connect your backend and AI intelligence layer.

---

## 1. Frontend on Vercel (1-Click Deployment)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsaoudhussaini-sudo%2Fveil&root-directory=frontend)

1. Click the button above or go to [Vercel New Project](https://vercel.com/new).
2. Select your repository: `saoudhussaini-sudo/veil`.
3. Set **Root Directory** to `frontend`.
4. Framework is automatically detected as **Next.js**.
5. Under **Environment Variables**, add:
   - `BACKEND_URL`: The public URL of your backend (see below).
6. Click **Deploy**.

---

## 2. Deploying / Connecting Your AI (Ollama & Backend)

Vercel is a serverless frontend platform with short function timeouts (10–60s) and memory caps (1–3GB), meaning **Ollama cannot run directly inside Vercel's serverless nodes**. 

Here are the standard solutions to connect your AI:

### Solution A: Tunnel to Your Local Machine (100% Free, Uses Your Local Ollama)
Keep running your local Ollama on your PC with zero cloud compute cost. Anyone visiting your Vercel URL can query your local models:

1. Start your local backend and Ollama:
   ```bash
   # Terminal 1: Ollama
   ollama serve

   # Terminal 2: VEIL Backend
   cd backend
   python run.py
   ```
2. Start a secure public tunnel (using Cloudflare Tunnel or ngrok):
   ```bash
   # With ngrok:
   ngrok http 8000

   # Or with Cloudflare Tunnel (no account required):
   npx cloudflared tunnel --url http://localhost:8000
   ```
3. Copy the resulting HTTPS URL (e.g., `https://xxxx.ngrok-free.app` or `https://xxxx.trycloudflare.com`).
4. In your Vercel Dashboard:
   - Go to **Project Settings** > **Environment Variables**.
   - Add `BACKEND_URL` = `https://your-tunnel-url`.
   - Click **Save** and trigger a redeploy.

---

### Solution B: Deploy the Backend to Render or Railway (24/7 Cloud Uptime)
To keep the backend running 24/7 without needing your personal laptop on:

1. Push the repository to GitHub (already done at `saoudhussaini-sudo/veil`).
2. Go to [Render](https://render.com) or [Railway](https://railway.app).
3. Create a **New Web Service** from your GitHub repo.
4. Set:
   - **Root Directory**: `backend`
   - **Runtime**: Docker (using the included `backend/Dockerfile`)
   - **Environment Variables**:
     - `LLM_PROVIDER`: `gemini` or `groq`
     - `LLM_API_KEY`: Your API key (both Groq and Gemini have generous free tiers)
     - `MOSS_PROJECT_ID` / `MOSS_PROJECT_KEY` (if using cloud Moss)
5. Deploy and copy your backend URL (e.g. `https://veil-backend.onrender.com`).
6. Set `BACKEND_URL` in Vercel to this URL.

---

### Solution C: Self-Hosted Cloud Ollama (GPU / Cloud VM)
If you want dedicated cloud GPUs running Ollama:
- Deploy Ollama on a GPU instance (RunPod, Modal, DigitalOcean GPU Droplet, or Hugging Face Spaces).
- Set `OLLAMA_BASE_URL` in your backend environment to point to your cloud Ollama instance.
