# Render Deployment Checklist

Use this checklist when deploying to Render.

## Prerequisites
- [ ] Render account created ([render.com](https://render.com))
- [ ] GitHub repository connected to Render
- [ ] Environment variables prepared (use `scripts/check-env.ps1`)

## Deployment Steps

### 1. Create Database Service
- [ ] Click "New" → "PostgreSQL"
- [ ] Name: `carbon-footprint-db`
- [ ] Region: Choose closest to you
- [ ] Copy the **Internal Database URL** (for backend)
- [ ] Copy the **External Database URL** (if needed for migrations)
- [ ] Database is created automatically ✅

### 2. Deploy Backend Service
- [ ] Click "New" → "Web Service"
- [ ] Connect your GitHub repository
- [ ] Settings:
  - **Name**: `carbon-footprint-backend`
  - **Root Directory**: `backend`
  - **Environment**: `Docker`
  - **Dockerfile Path**: `backend/Dockerfile`
  - **Build Command**: (leave empty, Docker handles it)
  - **Start Command**: (leave empty, Docker handles it)
- [ ] Add environment variables:
  ```
  FLASK_ENV=production
  DATABASE_URL=<Internal Database URL from step 1>
  SECRET_KEY=<your-secret-key>
  CORS_ORIGINS=https://your-frontend.onrender.com
  RATELIMIT_ENABLED=true
  CSRF_ENABLED=true
  ```
- [ ] Click "Create Web Service"
- [ ] Service builds and deploys automatically ✅

### 3. Deploy Frontend Service
- [ ] Click "New" → "Web Service"
- [ ] Connect your GitHub repository
- [ ] Settings:
  - **Name**: `carbon-footprint-frontend`
  - **Root Directory**: `frontend`
  - **Environment**: `Docker`
  - **Dockerfile Path**: `frontend/Dockerfile`
- [ ] Add environment variable:
  ```
  VITE_API_URL=https://your-backend.onrender.com/api
  ```
- [ ] Click "Create Web Service"
- [ ] Service builds and deploys automatically ✅

### 4. Set All Environment Variables
- [ ] Backend variables set (see step 2) ✅
- [ ] Frontend variables set (see step 3) ✅
- [ ] Database URL set correctly ✅

### 5. Run Database Migrations
- [ ] Go to backend service dashboard
- [ ] Click "Shell" tab
- [ ] Run: `flask db upgrade`
- [ ] Verify migration completed successfully ✅

### 6. Verify Services Are Healthy
- [ ] Backend health check: `https://your-backend.onrender.com/api/health`
- [ ] Frontend loads: `https://your-frontend.onrender.com`
- [ ] API calls work (check browser console)
- [ ] No CORS errors
- [ ] Database connection working (check health endpoint response)

## Post-Deployment

- [ ] Update `CORS_ORIGINS` with actual frontend URL
- [ ] Update `VITE_API_URL` with actual backend URL
- [ ] Test user registration
- [ ] Test user login
- [ ] Test creating emissions
- [ ] Test viewing dashboard

## Render Dashboard Features

- **Logs**: View real-time logs from service dashboard
- **Shell**: Access container shell for running commands
- **Events**: View deployment history
- **Metrics**: Monitor CPU, memory, and network usage

## Troubleshooting

- **Build fails**: Check Dockerfile and build logs in dashboard
- **Database connection fails**: Verify `DATABASE_URL` uses Internal URL
- **CORS errors**: Update `CORS_ORIGINS` with exact frontend URL
- **Migrations fail**: Use Shell tab to run migrations manually
- **Service sleeps**: Free tier services sleep after inactivity (upgrade to paid to prevent)

