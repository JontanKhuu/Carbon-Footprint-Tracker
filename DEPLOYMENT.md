# Deployment Guide - Carbon Footprint Tracker

This guide covers multiple deployment options for your Carbon Footprint Tracker application.

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Docker-Based Deployment](#docker-based-deployment)
3. [Cloud Platform Deployments](#cloud-platform-deployments)
   - [Option A: Railway](#option-a-railway-recommended)
   - [Option B: Render](#option-b-render)
   - [Option C: AWS (EC2/ECS)](#option-c-aws-ec2ecs)
   - [Option D: Heroku](#option-d-heroku)
4. [VPS Deployment](#vps-deployment)
5. [Frontend-Only Deployment (Vercel/Netlify)](#frontend-only-deployment-vercelnetlify)
6. [Post-Deployment Steps](#post-deployment-steps)
7. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] **Environment Variables**: Create a `.env` file with production values
- [ ] **Database**: Set up a production PostgreSQL database
- [ ] **Secret Key**: Generate a strong `SECRET_KEY` for Flask
- [ ] **CORS Origins**: Update CORS settings to allow your production domain
- [ ] **API URL**: Update frontend API URL to point to production backend
- [ ] **SSL Certificate**: Plan for HTTPS (most platforms provide this automatically)
- [ ] **Domain Name**: Optional but recommended for production

### Required Environment Variables

Create a `.env` file in the project root:

```bash
# Database
POSTGRES_USER=your_production_user
POSTGRES_PASSWORD=your_strong_password
POSTGRES_DB=carbon_footprint_prod
DATABASE_URL=postgresql://user:password@host:port/database

# Flask
FLASK_ENV=production
SECRET_KEY=your-very-secure-secret-key-here-generate-with-openssl-rand-hex-32
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Frontend
VITE_API_URL=https://api.yourdomain.com/api

# Optional: Rate Limiting (Redis for distributed rate limiting)
RATELIMIT_STORAGE_URL=redis://your-redis-url:6379
RATELIMIT_ENABLED=true
```

**Generate a secure SECRET_KEY:**
```bash
# On Linux/Mac
openssl rand -hex 32

# On Windows (PowerShell)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

---

## Docker-Based Deployment

### Option 1: Single Server with Docker Compose

This is the simplest deployment option for a single server.

#### Prerequisites
- Server with Docker and Docker Compose installed
- Domain name (optional but recommended)
- SSL certificate (Let's Encrypt recommended)

#### Steps

1. **Clone repository on server**
   ```bash
   git clone <your-repo-url>
   cd carbon-footprint-tracker
   ```

2. **Create production docker-compose file**
   Create `docker-compose.prod.yml`:
   ```yaml
   version: '3.8'

   services:
     db:
       image: postgres:16-alpine
       container_name: carbon_footprint_db_prod
       environment:
         POSTGRES_USER: ${POSTGRES_USER}
         POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
         POSTGRES_DB: ${POSTGRES_DB}
       volumes:
         - postgres_data:/var/lib/postgresql/data
       networks:
         - carbon_footprint_network
       restart: unless-stopped
       healthcheck:
         test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
         interval: 10s
         timeout: 5s
         retries: 5

     backend:
       build:
         context: ./backend
         dockerfile: Dockerfile
       container_name: carbon_footprint_backend_prod
       environment:
         FLASK_APP: app.py
         FLASK_ENV: production
         DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
         SECRET_KEY: ${SECRET_KEY}
         CORS_ORIGINS: ${CORS_ORIGINS}
       ports:
         - "5000:5000"
       depends_on:
         db:
           condition: service_healthy
       networks:
         - carbon_footprint_network
       restart: unless-stopped

     frontend:
       build:
         context: ./frontend
         dockerfile: Dockerfile
         args:
           - VITE_API_URL=${VITE_API_URL}
       container_name: carbon_footprint_frontend_prod
       ports:
         - "3000:3000"
       depends_on:
         - backend
       networks:
         - carbon_footprint_network
       restart: unless-stopped

     nginx:
       image: nginx:alpine
       container_name: carbon_footprint_nginx
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
         - ./nginx/ssl:/etc/nginx/ssl:ro
       depends_on:
         - frontend
         - backend
       networks:
         - carbon_footprint_network
       restart: unless-stopped

   volumes:
     postgres_data:

   networks:
     carbon_footprint_network:
       driver: bridge
   ```

3. **Create Nginx configuration**
   Create `nginx/nginx.conf`:
   ```nginx
   upstream backend {
       server backend:5000;
   }

   upstream frontend {
       server frontend:3000;
   }

   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       
       # Redirect HTTP to HTTPS
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name yourdomain.com www.yourdomain.com;

       ssl_certificate /etc/nginx/ssl/fullchain.pem;
       ssl_certificate_key /etc/nginx/ssl/privkey.pem;

       # Security headers
       add_header X-Frame-Options "SAMEORIGIN" always;
       add_header X-Content-Type-Options "nosniff" always;
       add_header X-XSS-Protection "1; mode=block" always;
       add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

       # Frontend
       location / {
           proxy_pass http://frontend;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       # Backend API
       location /api {
           proxy_pass http://backend;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       # Health check
       location /health {
           proxy_pass http://backend/health;
       }
   }
   ```

4. **Set up SSL with Let's Encrypt**
   ```bash
   # Install certbot
   sudo apt-get update
   sudo apt-get install certbot

   # Get certificate
   sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

   # Copy certificates to nginx/ssl directory
   sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./nginx/ssl/
   sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./nginx/ssl/
   ```

5. **Deploy**
   ```bash
   # Build and start services
   docker-compose -f docker-compose.prod.yml up -d --build

   # Run database migrations
   docker-compose -f docker-compose.prod.yml exec backend flask db upgrade

   # View logs
   docker-compose -f docker-compose.prod.yml logs -f
   ```

6. **Set up auto-renewal for SSL**
   ```bash
   # Add to crontab
   sudo crontab -e
   # Add this line:
   0 0 * * * certbot renew --quiet && docker-compose -f /path/to/docker-compose.prod.yml restart nginx
   ```

---

## Cloud Platform Deployments

### Option A: Railway (Recommended)

Railway is excellent for full-stack apps with PostgreSQL support.

#### Steps

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Add PostgreSQL Database**
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway will provide connection string automatically

4. **Deploy Backend**
   - Click "New" → "GitHub Repo" → Select your repo
   - Set root directory to `backend`
   - Add environment variables:
     ```
     FLASK_ENV=production
     DATABASE_URL=${{Postgres.DATABASE_URL}}
     SECRET_KEY=your-secret-key-here
     CORS_ORIGINS=https://your-app.railway.app
     ```
   - Railway will auto-detect Dockerfile and deploy

5. **Deploy Frontend**
   - Click "New" → "GitHub Repo" → Select your repo
   - Set root directory to `frontend`
   - Add environment variable:
     ```
     VITE_API_URL=https://your-backend.railway.app/api
     ```
   - Railway will auto-detect Dockerfile and deploy

6. **Run Database Migrations**
   - Go to backend service
   - Click "Deployments" → "View Logs"
   - Or use Railway CLI:
     ```bash
     railway run --service backend flask db upgrade
     ```

7. **Get URLs**
   - Railway provides HTTPS URLs automatically
   - Update frontend `VITE_API_URL` with backend URL
   - Redeploy frontend if needed

**Cost**: Free tier available, then pay-as-you-go (~$5-20/month)

---

### Option B: Render

Render offers free PostgreSQL and easy deployment.

#### Steps

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create PostgreSQL Database**
   - Click "New" → "PostgreSQL"
   - Name: `carbon-footprint-db`
   - Region: Choose closest to you
   - Copy the "Internal Database URL"

3. **Deploy Backend**
   - Click "New" → "Web Service"
   - Connect your GitHub repo
   - Settings:
     - **Name**: `carbon-footprint-backend`
     - **Root Directory**: `backend`
     - **Environment**: `Docker`
     - **Dockerfile Path**: `backend/Dockerfile`
     - **Build Command**: (leave empty, Docker handles it)
     - **Start Command**: (leave empty, Docker handles it)
   - Environment Variables:
     ```
     FLASK_ENV=production
     DATABASE_URL=<Internal Database URL from step 2>
     SECRET_KEY=<generate-secure-key>
     CORS_ORIGINS=https://your-frontend.onrender.com
     ```
   - Click "Create Web Service"

4. **Deploy Frontend**
   - Click "New" → "Web Service"
   - Connect your GitHub repo
   - Settings:
     - **Name**: `carbon-footprint-frontend`
     - **Root Directory**: `frontend`
     - **Environment**: `Docker`
     - **Dockerfile Path**: `frontend/Dockerfile`
   - Environment Variables:
     ```
     VITE_API_URL=https://your-backend.onrender.com/api
     ```
   - Click "Create Web Service"

5. **Run Database Migrations**
   - Go to backend service
   - Click "Shell" tab
   - Run: `flask db upgrade`

**Cost**: Free tier available (with limitations), then $7-25/month per service

---

### Option C: AWS (EC2/ECS)

For more control and scalability.

#### Option C1: AWS EC2 (Single Server)

1. **Launch EC2 Instance**
   - Choose Ubuntu 22.04 LTS
   - Instance type: t3.small or larger
   - Configure security group:
     - Port 22 (SSH)
     - Port 80 (HTTP)
     - Port 443 (HTTPS)

2. **Set up RDS PostgreSQL**
   - Create RDS PostgreSQL instance
   - Note the endpoint and credentials

3. **SSH into EC2**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

4. **Install Docker**
   ```bash
   sudo apt-get update
   sudo apt-get install -y docker.io docker-compose
   sudo usermod -aG docker ubuntu
   # Log out and back in
   ```

5. **Clone and Deploy**
   ```bash
   git clone <your-repo>
   cd carbon-footprint-tracker
   # Create .env file with RDS connection string
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

#### Option C2: AWS ECS (Container Orchestration)

1. **Create ECR Repository**
   ```bash
   aws ecr create-repository --repository-name carbon-footprint-backend
   aws ecr create-repository --repository-name carbon-footprint-frontend
   ```

2. **Build and Push Images**
   ```bash
   # Backend
   docker build -t carbon-footprint-backend ./backend
   docker tag carbon-footprint-backend:latest <account>.dkr.ecr.<region>.amazonaws.com/carbon-footprint-backend:latest
   docker push <account>.dkr.ecr.<region>.amazonaws.com/carbon-footprint-backend:latest

   # Frontend
   docker build -t carbon-footprint-frontend ./frontend
   docker tag carbon-footprint-frontend:latest <account>.dkr.ecr.<region>.amazonaws.com/carbon-footprint-frontend:latest
   docker push <account>.dkr.ecr.<region>.amazonaws.com/carbon-footprint-frontend:latest
   ```

3. **Create ECS Cluster and Services**
   - Use AWS Console or CloudFormation
   - Set up RDS PostgreSQL
   - Configure environment variables
   - Set up Application Load Balancer

**Cost**: ~$30-100/month depending on usage

---

### Option D: Heroku

Heroku is simple but more expensive.

#### Steps

1. **Install Heroku CLI**
   ```bash
   # Download from heroku.com/cli
   ```

2. **Create Heroku Apps**
   ```bash
   heroku login
   heroku create carbon-footprint-backend
   heroku create carbon-footprint-frontend
   ```

3. **Add PostgreSQL**
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev --app carbon-footprint-backend
   ```

4. **Deploy Backend**
   ```bash
   cd backend
   heroku git:remote -a carbon-footprint-backend
   # Create Procfile: web: gunicorn app:app
   git push heroku main
   heroku run flask db upgrade --app carbon-footprint-backend
   ```

5. **Set Environment Variables**
   ```bash
   heroku config:set SECRET_KEY=your-key --app carbon-footprint-backend
   heroku config:set CORS_ORIGINS=https://carbon-footprint-frontend.herokuapp.com --app carbon-footprint-backend
   ```

6. **Deploy Frontend**
   ```bash
   cd frontend
   heroku git:remote -a carbon-footprint-frontend
   # Create Procfile: web: npm run start (or use static build)
   heroku config:set VITE_API_URL=https://carbon-footprint-backend.herokuapp.com/api
   git push heroku main
   ```

**Cost**: $7-25/month per dyno + database

---

## VPS Deployment

For DigitalOcean, Linode, Vultr, etc.

1. **Create VPS**
   - Choose Ubuntu 22.04
   - Minimum: 2GB RAM, 1 vCPU
   - Recommended: 4GB RAM, 2 vCPU

2. **Follow Docker-Based Deployment steps** (see above)

3. **Set up Firewall**
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

**Cost**: $5-20/month

---

## Frontend-Only Deployment (Vercel/Netlify)

If you want to deploy frontend separately:

### Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   cd frontend
   vercel
   ```

3. **Set Environment Variable**
   - In Vercel dashboard: Settings → Environment Variables
   - Add: `VITE_API_URL=https://your-backend-url.com/api`

### Netlify

1. **Install Netlify CLI**
   ```bash
   npm i -g netlify-cli
   ```

2. **Create `netlify.toml`**
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

3. **Deploy**
   ```bash
   cd frontend
   netlify deploy --prod
   ```

4. **Set Environment Variable**
   - In Netlify dashboard: Site settings → Environment variables
   - Add: `VITE_API_URL`

---

## Post-Deployment Steps

### 1. Verify Deployment

- [ ] Frontend loads at your domain
- [ ] Backend health check: `https://your-api.com/api/health`
- [ ] Can register a new user
- [ ] Can log in
- [ ] Can create emissions
- [ ] Database migrations applied

### 2. Set up Monitoring

**Option A: Uptime Monitoring**
- Use [UptimeRobot](https://uptimerobot.com) (free)
- Monitor: `https://your-api.com/api/health`

**Option B: Application Monitoring**
- [Sentry](https://sentry.io) for error tracking
- [LogRocket](https://logrocket.com) for frontend monitoring

### 3. Set up Backups

**Database Backups:**
```bash
# Add to crontab (daily backup)
0 2 * * * docker exec carbon_footprint_db_prod pg_dump -U postgres carbon_footprint > /backups/backup_$(date +\%Y\%m\%d).sql
```

**Or use managed database backups** (if using RDS, Railway, etc.)

### 4. Set up CI/CD

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /path/to/app
            git pull
            docker-compose -f docker-compose.prod.yml up -d --build
            docker-compose -f docker-compose.prod.yml exec backend flask db upgrade
```

---

## Troubleshooting

### Backend won't start
- Check logs: `docker-compose logs backend`
- Verify `DATABASE_URL` is correct
- Ensure database is accessible
- Check `SECRET_KEY` is set

### Frontend can't connect to backend
- Verify `VITE_API_URL` is correct
- Check CORS settings in backend
- Ensure backend is running and accessible
- Check browser console for errors

### Database connection errors
- Verify database credentials
- Check network connectivity
- Ensure database is running
- Check firewall rules

### 502 Bad Gateway
- Backend service is down
- Check backend logs
- Verify backend health endpoint

### SSL Certificate issues
- Ensure certificate files are in correct location
- Check certificate expiration
- Verify nginx configuration

---

## Quick Reference

### Update Deployment
```bash
git pull
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml exec backend flask db upgrade
```

### View Logs
```bash
docker-compose -f docker-compose.prod.yml logs -f [service-name]
```

### Restart Services
```bash
docker-compose -f docker-compose.prod.yml restart [service-name]
```

### Access Database
```bash
docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d carbon_footprint
```

---

## Recommended Deployment Strategy

**For Beginners**: Railway or Render (easiest setup)
**For Production**: AWS ECS or VPS with Docker Compose (more control)
**For Budget**: VPS with Docker Compose (~$5-10/month)
**For Scale**: AWS ECS or Kubernetes (auto-scaling)

---

## Need Help?

- Check application logs
- Review environment variables
- Verify database connectivity
- Test API endpoints with Postman/curl
- Check browser console for frontend errors

Good luck with your deployment! 🚀

