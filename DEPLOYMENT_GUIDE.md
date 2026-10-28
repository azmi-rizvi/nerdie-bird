# 🚀 FeatherCare - Complete Production Deployment Guide

This guide provides a simple, sequential step-by-step process to deploy your **FeatherCare** application to the web for free.

---

## 💡 Architecture Overview: Why This Setup?

Your project consists of two distinct components:
1. **Frontend (`nerdie-frontend`)**: A React + Vite Single Page Application (SPA). **Vercel** is the gold standard for hosting Vite apps because it offers instantaneous CDN distribution, free SSL certificates, and zero configuration.
2. **Backend (`backend`)**: A Node.js + Express server with a local **SQLite database (`feathercare.db`)**, image uploads, and Gemini AI. 

> [!NOTE]
> **Why Render for Backend + Vercel for Frontend?**
> Vercel is a **serverless** platform designed for stateless frontend functions. Because SQLite writes to a local `.db` file, running an active SQLite database on Vercel's temporary lambda storage causes data to disappear between cold starts.
> 
> Therefore, professional full-stack developers use the **Industry Standard Decoupled Pattern**:
> - **Frontend** on **Vercel** (lightning-fast UI).
> - **Backend** on **Render** (free continuous Node.js server that keeps SQLite and Gemini intact).
> 
> Connecting them takes **1 minute** by adding one environment variable (`VITE_API_URL`).

---

## Step 1: Push Your Code to GitHub

If you haven't pushed your latest changes to GitHub, run these commands in your project terminal:

```bash
git add .
git commit -m "FeatherCare ready for production deployment"
git push origin main
```

*(Ensure your GitHub repository contains both the `backend/` and `nerdie-frontend/` folders).*

---

## Step 2: Deploy the Backend on Render (Free)

1. Go to **[render.com](https://render.com/)** and sign in with your GitHub account.
2. In the dashboard, click **"New +"** and choose **"Web Service"**.
3. Select your `nerdie-bird` (or your project) GitHub repository.
4. Fill in the deployment settings:
   - **Name**: `feathercare-backend` (or your preferred name)
   - **Region**: Choose the closest region (e.g. Oregon, Frankfurt, Singapore)
   - **Root Directory**: `backend` *(Important: set this to `backend`)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`
5. Scroll down to **Environment Variables** and click **"Add Environment Variable"**:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: *(Paste your Google Gemini API key)*
   - *(Optional)* **Key**: `NODE_ENV`, **Value**: `production`
6. Click **"Deploy Web Service"**.
7. Render will build and launch your backend. Once deployed (takes ~2 minutes), copy your live backend URL from the top of the page:
   ```
   https://feathercare-backend.onrender.com
   ```
   *(You can verify it works by opening `https://feathercare-backend.onrender.com/api/health` in your browser—it should return `{"status":"ok"}`).*

---

## Step 3: Deploy the Frontend on Vercel

1. Go to **[vercel.com](https://vercel.com/)** and sign in with your GitHub account.
2. In the Vercel Dashboard, click **"Add New..."** → **"Project"**.
3. Locate your GitHub repository and click **"Import"**.
4. In the **Configure Project** screen:
   - **Project Name**: `feathercare` (or your choice)
   - **Framework Preset**: `Vite` (Vercel detects this automatically)
   - **Root Directory**: Click **"Edit"**, choose `nerdie-frontend`, and click **"Continue"**. *(Critical step!)*
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
5. Expand the **"Environment Variables"** section and add:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://feathercare-backend.onrender.com` *(Paste the Render backend URL from Step 2, without a trailing slash)*
6. Click **"Deploy"**.

Vercel will build your React application in ~45 seconds and give you a live production URL:
```
https://feathercare.vercel.app
```

---

## Step 4: Verification & Final Testing

Open your live Vercel URL and test the key features:
1. **Explore Birds**: Browse the pre-loaded bird species catalog.
2. **✨ Discover New Bird**: Click the button to watch Gemini AI generate a real bird and automatically save it to your live catalog.
3. **Gemini AI Bird Identification**: Upload a photo or enter a text description to verify image retrieval and AI recognition.
4. **Symptom Checker & Emergency Guide**: Search an avian symptom to see AI triage tips and veterinary warnings.
5. **My Birds Flock**: Add a companion bird, edit notes, and generate an AI bonding tip.

---

## 🛠️ Summary of Configured Files in Your Project

Your repository is already pre-configured for smooth deployment:
- **`nerdie-frontend/vercel.json`**: Configures single-page application (SPA) routing rewrites so refreshing pages like `/explore` or `/my-birds` never gives 404 errors.
- **`nerdie-frontend/src/services/api.js`**: Dynamically reads `import.meta.env.VITE_API_URL` in production while defaulting to `http://localhost:5001` in local development.
- **`backend/server.js`**: Dynamic CORS configuration (`origin: true`) automatically accepts requests from any Vercel domain.
