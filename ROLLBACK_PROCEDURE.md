# Rollback Procedure

This document outlines the procedure for rolling back the Carbon Footprint Tracker application to a previous version in case of deployment issues.

## Prerequisites

Before deployment, ensure you have:
- [ ] Database backup from before deployment
- [ ] Previous Docker images tagged with version numbers
- [ ] Git tags for each deployment version
- [ ] Access to deployment server/cloud platform

## Rollback Scenarios

### Scenario 1: Docker Compose Deployment (VPS/Server)

#### Quick Rollback (Same Server)

1. **Stop current containers**
   ```bash
   docker-compose -f docker-compose.prod.yml down
   ```

2. **Checkout previous version**
   ```bash
   git checkout <previous-version-tag>
   # Or
   git checkout <previous-commit-hash>
   ```

3. **Restore previous .env file** (if changed)
   ```bash
   cp .env.backup .env  # If you backed up .env before deployment
   ```

4. **Restore database** (if database schema changed)
   ```bash
   # Option A: Restore from backup
   docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d carbon_footprint < backup.sql
   
   # Option B: Rollback migrations
   docker-compose -f docker-compose.prod.yml exec backend flask db downgrade -1
   # Or downgrade to specific revision
   docker-compose -f docker-compose.prod.yml exec backend flask db downgrade <revision>
   ```

5. **Rebuild and start previous version**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

6. **Verify rollback**
   ```bash
   # Check health
   curl http://localhost:5000/api/health
   
   # Check logs
   docker-compose -f docker-compose.prod.yml logs -f
   ```

#### Using Previous Docker Images

If you tagged images with versions:

1. **List available images**
   ```bash
   docker images | grep carbon-footprint
   ```

2. **Update docker-compose.prod.yml** to use previous image tags
   ```yaml
   backend:
     image: carbon-footprint-backend:v1.0.0  # Previous version
   frontend:
     image: carbon-footprint-frontend:v1.0.0  # Previous version
   ```

3. **Start with previous images**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

---

### Scenario 2: Cloud Platform (Railway/Render/AWS)

#### Railway

1. **Go to Railway dashboard**
2. **Navigate to your service**
3. **Go to "Deployments" tab**
4. **Find previous successful deployment**
5. **Click "Redeploy" on the previous deployment**

#### Render

1. **Go to Render dashboard**
2. **Navigate to your service**
3. **Go to "Events" or "Deployments" tab**
4. **Find previous successful deployment**
5. **Click "Manual Deploy" → Select previous commit**

#### AWS (ECS)

1. **Go to ECS Console**
2. **Navigate to your service**
3. **Go to "Deployments" tab**
4. **Find previous task definition**
5. **Update service to use previous task definition**

---

### Scenario 3: Database Rollback

#### If Database Schema Changed

1. **List migration history**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend flask db history
   ```

2. **Identify target revision**
   ```bash
   # Find the revision before the problematic migration
   docker-compose -f docker-compose.prod.yml exec backend flask db current
   ```

3. **Rollback to specific revision**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend flask db downgrade <revision>
   ```

4. **Verify rollback**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend flask db current
   ```

#### If Data Corruption Occurred

1. **Stop application**
   ```bash
   docker-compose -f docker-compose.prod.yml stop backend frontend
   ```

2. **Restore database from backup**
   ```bash
   # For PostgreSQL in Docker
   docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres -d carbon_footprint < backup_YYYYMMDD.sql
   
   # Or drop and recreate
   docker-compose -f docker-compose.prod.yml exec db psql -U postgres -c "DROP DATABASE carbon_footprint;"
   docker-compose -f docker-compose.prod.yml exec db psql -U postgres -c "CREATE DATABASE carbon_footprint;"
   docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres -d carbon_footprint < backup_YYYYMMDD.sql
   ```

3. **Restart services**
   ```bash
   docker-compose -f docker-compose.prod.yml start backend frontend
   ```

---

## Pre-Deployment Checklist (To Enable Easy Rollback)

Before deploying, ensure:

- [ ] **Tag current Git version**
  ```bash
  git tag -a v1.0.0 -m "Version 1.0.0 - Pre-deployment"
  git push origin v1.0.0
  ```

- [ ] **Backup database**
  ```bash
  docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U postgres carbon_footprint > backup_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] **Backup .env file** (if changed)
  ```bash
  cp .env .env.backup
  ```

- [ ] **Tag Docker images** (if using custom registry)
  ```bash
  docker tag carbon-footprint-backend:latest carbon-footprint-backend:v1.0.0
  docker tag carbon-footprint-frontend:latest carbon-footprint-frontend:v1.0.0
  docker push carbon-footprint-backend:v1.0.0
  docker push carbon-footprint-frontend:v1.0.0
  ```

- [ ] **Document current migration version**
  ```bash
  docker-compose -f docker-compose.prod.yml exec backend flask db current > migration_version.txt
  ```

---

## Post-Rollback Verification

After rolling back, verify:

1. **Health Check**
   ```bash
   curl http://your-domain.com/api/health
   ```

2. **Application Functionality**
   - [ ] Can access frontend
   - [ ] Can login
   - [ ] Can view dashboard
   - [ ] Can create emissions
   - [ ] Database queries work

3. **Check Logs**
   ```bash
   docker-compose -f docker-compose.prod.yml logs backend
   docker-compose -f docker-compose.prod.yml logs frontend
   ```

4. **Database Integrity**
   ```bash
   docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d carbon_footprint -c "SELECT COUNT(*) FROM users;"
   docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d carbon_footprint -c "SELECT COUNT(*) FROM emissions;"
   ```

---

## Emergency Rollback (Fastest Method)

If you need to rollback immediately:

1. **Stop everything**
   ```bash
   docker-compose -f docker-compose.prod.yml down
   ```

2. **Restore from last known good backup**
   ```bash
   # Restore database
   docker-compose -f docker-compose.prod.yml up -d db
   sleep 5  # Wait for DB to start
   docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres -d carbon_footprint < last_known_good_backup.sql
   
   # Start previous version
   git checkout <last-known-good-tag>
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

---

## Prevention Tips

To minimize the need for rollbacks:

1. **Test in staging first**
2. **Use feature flags for new features**
3. **Deploy during low-traffic periods**
4. **Have database backups scheduled**
5. **Use blue-green deployment when possible**
6. **Monitor application health after deployment**

---

## Contact Information

In case of rollback issues:
- Check application logs
- Review deployment documentation
- Contact DevOps team
- Check cloud provider status page

---

**Remember**: Always test rollback procedures in a staging environment before production deployment!

