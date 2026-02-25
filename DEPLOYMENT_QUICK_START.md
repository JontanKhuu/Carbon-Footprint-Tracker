# Deployment Quick Start Guide

This is a condensed guide for quick deployment. For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 🚀 Fastest Deployment Options

### Option 1: Railway (Recommended for Beginners)
**Time**: 15-20 minutes | **Cost**: Free tier available

1. Sign up at [railway.app](https://railway.app)
2. Create new project → Deploy from GitHub
3. Add PostgreSQL database
4. Deploy backend (set root: `backend`, add env vars)
5. Deploy frontend (set root: `frontend`, set `VITE_API_URL`)
6. Run migrations: `railway run --service backend flask db upgrade`

**Done!** Railway provides HTTPS URLs automatically.

---

### Option 2: Render
**Time**: 20-25 minutes | **Cost**: Free tier available

1. Sign up at [render.com](https://render.com)
2. Create PostgreSQL database
3. Deploy backend as Web Service (Docker, root: `backend`)
4. Deploy frontend as Web Service (Docker, root: `frontend`)
5. Run migrations via Shell tab

**Done!** Render provides HTTPS URLs automatically.

---

### Option 3: VPS with Docker (Best Value)
**Time**: 30-45 minutes | **Cost**: $5-10/month

1. Get VPS (DigitalOcean, Linode, Vultr)
2. Install Docker: `curl -fsSL https://get.docker.com | sh`
3. Clone repo: `git clone <your-repo>`
4. Create `.env` file (copy from `env.example`)
5. Deploy: `docker-compose -f docker-compose.prod.yml up -d`
6. Set up SSL with Let's Encrypt
7. Run migrations: `docker-compose -f docker-compose.prod.yml exec backend flask db upgrade`

**Done!** Full control, lowest cost.

---

## 📋 Essential Environment Variables

Create a `.env` file with these values:

```bash
# Required
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=carbon_footprint
SECRET_KEY=<generate-with-openssl-rand-hex-32>
CORS_ORIGINS=https://yourdomain.com
VITE_API_URL=https://your-backend-url.com/api

# Optional
RATELIMIT_ENABLED=true
```

**Generate SECRET_KEY:**
```bash
openssl rand -hex 32
```

---

## ✅ Post-Deployment Checklist

- [ ] Backend health check works: `/api/health`
- [ ] Frontend loads
- [ ] Can register user
- [ ] Can login
- [ ] Can create emissions
- [ ] Database migrations applied
- [ ] HTTPS/SSL working
- [ ] No CORS errors

---

## 🔧 Common Issues

**Backend won't start**
- Check `DATABASE_URL` is correct
- Verify database is accessible
- Check logs: `docker-compose logs backend`

**Frontend can't connect**
- Verify `VITE_API_URL` matches backend URL
- Check CORS settings include frontend domain
- Check browser console for errors

**Database errors**
- Verify credentials
- Check database is running
- Ensure migrations ran: `flask db upgrade`

---

## 📚 Full Documentation

- **Detailed Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Checklist**: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **Main README**: [README.md](./README.md)

---

## 🆘 Need Help?

1. Check application logs
2. Verify environment variables
3. Test API endpoints
4. Review deployment guide for your platform

Good luck! 🎉

