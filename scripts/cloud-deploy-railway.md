# Railway Deployment Checklist

Use this checklist when deploying to Railway.

## Prerequisites
- [ ] Railway account created ([railway.app](https://railway.app))
- [ ] GitHub repository connected to Railway
- [ ] Environment variables prepared (use `scripts/check-env.ps1`)

## Deployment Steps

### 1. Create Database Service
- [ ] Click "New" → "Database" → "Add PostgreSQL"
- [ ] Note the automatically provided `DATABASE_URL`
- [ ] Database is created automatically ✅

### 2. Deploy Backend Service
- [ ] Click "New" → "GitHub Repo" → Select your repository
- [ ] Set **Root Directory**: `backend`
- [ ] Railway auto-detects Dockerfile ✅
- [ ] Add environment variables:
  ```
  FLASK_ENV=production
  DATABASE_URL=${{Postgres.DATABASE_URL}}
  SECRET_KEY=<your-secret-key>
  CORS_ORIGINS=https://your-frontend.railway.app
  RATELIMIT_ENABLED=true
  CSRF_ENABLED=true
  ```
- [ ] Service deploys automatically ✅

### 3. Deploy Frontend Service
- [ ] Click "New" → "GitHub Repo" → Select your repository
- [ ] Set **Root Directory**: `frontend`
- [ ] Railway auto-detects Dockerfile ✅
- [ ] Add environment variable:
  ```
  VITE_API_URL=https://your-backend.railway.app/api
  ```
- [ ] Service deploys automatically ✅

### 4. Set All Environment Variables
- [ ] Backend variables set (see step 2) ✅
- [ ] Frontend variables set (see step 3) ✅
- [ ] Database URL automatically linked ✅

### 5. Run Database Migrations
- [ ] Open backend service
- [ ] Click "Deployments" → "View Logs" to verify deployment
- [ ] Use Railway CLI:
  ```bash
  railway run --service backend flask db upgrade
  ```
- [ ] Or use Railway dashboard → Backend service → "Deployments" → "Run Command"
- [ ] Verify migration completed successfully ✅

### 6. Verify Services Are Healthy
- [ ] Backend health check: `https://your-backend.railway.app/api/health`
- [ ] Frontend loads: `https://your-frontend.railway.app`
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

## Railway CLI Commands

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Run migrations
railway run --service backend flask db upgrade

# View logs
railway logs --service backend

# Check status
railway status
```

## Troubleshooting

- **Build fails**: Check Dockerfile and build logs
- **Database connection fails**: Verify `DATABASE_URL` is set correctly
- **CORS errors**: Update `CORS_ORIGINS` with exact frontend URL
- **Migrations fail**: Check database is accessible and migrations are up to date

