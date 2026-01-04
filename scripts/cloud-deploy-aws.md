# AWS Deployment Checklist

Use this checklist when deploying to AWS (EC2/ECS).

## Prerequisites
- [ ] AWS account created
- [ ] AWS CLI installed and configured
- [ ] Docker installed locally (for building images)
- [ ] Environment variables prepared (use `scripts/check-env.ps1`)

## Option A: EC2 Deployment

### 1. Create Database Service (RDS)
- [ ] Go to RDS Console → "Create database"
- [ ] Engine: PostgreSQL
- [ ] Template: Production or Dev/Test
- [ ] Settings:
  - DB instance identifier: `carbon-footprint-db`
  - Master username: `postgres` (or custom)
  - Master password: (strong password)
  - DB instance class: db.t3.micro (free tier) or larger
- [ ] Network & Security:
  - VPC: Default or custom
  - Public access: No (recommended) or Yes (for testing)
  - Security group: Allow PostgreSQL (port 5432) from EC2 security group
- [ ] Database name: `carbon_footprint`
- [ ] Click "Create database"
- [ ] Note the endpoint URL ✅

### 2. Launch EC2 Instance
- [ ] Go to EC2 Console → "Launch Instance"
- [ ] Name: `carbon-footprint-server`
- [ ] AMI: Ubuntu Server 22.04 LTS
- [ ] Instance type: t3.small or larger
- [ ] Key pair: Create or select existing
- [ ] Network settings:
  - Security group: Allow SSH (22), HTTP (80), HTTPS (443)
- [ ] Launch instance ✅

### 3. Deploy Backend Service
- [ ] SSH into EC2:
  ```bash
  ssh -i your-key.pem ubuntu@your-ec2-ip
  ```
- [ ] Install Docker:
  ```bash
  sudo apt-get update
  sudo apt-get install -y docker.io docker-compose
  sudo usermod -aG docker ubuntu
  # Log out and back in
  ```
- [ ] Clone repository:
  ```bash
  git clone <your-repo>
  cd carbon-footprint-tracker
  ```
- [ ] Create `.env` file with RDS connection:
  ```bash
  DATABASE_URL=postgresql://user:password@rds-endpoint:5432/carbon_footprint
  SECRET_KEY=<your-secret-key>
  CORS_ORIGINS=https://your-domain.com
  FLASK_ENV=production
  ```
- [ ] Deploy:
  ```bash
  docker-compose -f docker-compose.prod.yml up -d --build
  ```
- [ ] Backend deployed ✅

### 4. Deploy Frontend Service
- [ ] Frontend is included in docker-compose ✅
- [ ] Or deploy separately if needed
- [ ] Update `VITE_API_URL` in `.env` ✅

### 5. Set All Environment Variables
- [ ] `.env` file created with all variables ✅
- [ ] RDS connection string set ✅
- [ ] SECRET_KEY generated ✅
- [ ] CORS_ORIGINS updated ✅

### 6. Run Database Migrations
- [ ] SSH into EC2
- [ ] Run:
  ```bash
  docker-compose -f docker-compose.prod.yml exec backend flask db upgrade
  ```
- [ ] Verify migration completed ✅

### 7. Verify Services Are Healthy
- [ ] Backend health: `http://your-ec2-ip:5000/api/health`
- [ ] Frontend loads: `http://your-ec2-ip:3000`
- [ ] Set up domain and SSL (optional)

## Option B: ECS Deployment

### 1. Create Database Service (RDS)
- [ ] Same as EC2 option (see above) ✅

### 2. Create ECR Repositories
- [ ] Backend repository:
  ```bash
  aws ecr create-repository --repository-name carbon-footprint-backend
  ```
- [ ] Frontend repository:
  ```bash
  aws ecr create-repository --repository-name carbon-footprint-frontend
  ```
- [ ] Note repository URIs ✅

### 3. Build and Push Images
- [ ] Authenticate Docker:
  ```bash
  aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
  ```
- [ ] Build and push backend:
  ```bash
  docker build -t carbon-footprint-backend ./backend
  docker tag carbon-footprint-backend:latest <account>.dkr.ecr.<region>.amazonaws.com/carbon-footprint-backend:latest
  docker push <account>.dkr.ecr.<region>.amazonaws.com/carbon-footprint-backend:latest
  ```
- [ ] Build and push frontend:
  ```bash
  docker build -t carbon-footprint-frontend ./frontend
  docker tag carbon-footprint-frontend:latest <account>.dkr.ecr.<region>.amazonaws.com/carbon-footprint-frontend:latest
  docker push <account>.dkr.ecr.<region>.amazonaws.com/carbon-footprint-frontend:latest
  ```
- [ ] Images pushed to ECR ✅

### 4. Create ECS Cluster and Services
- [ ] Create ECS cluster
- [ ] Create task definitions for backend and frontend
- [ ] Set environment variables in task definitions
- [ ] Create services with Application Load Balancer
- [ ] Services deployed ✅

### 5. Set All Environment Variables
- [ ] Environment variables set in ECS task definitions ✅
- [ ] RDS connection string configured ✅
- [ ] Secrets stored in AWS Secrets Manager (recommended) ✅

### 6. Run Database Migrations
- [ ] Create one-off task:
  ```bash
  aws ecs run-task --cluster <cluster-name> --task-definition <backend-task-def> --launch-type FARGATE
  ```
- [ ] Or use ECS Exec to run command in running container
- [ ] Migrations completed ✅

### 7. Verify Services Are Healthy
- [ ] Check ALB health checks
- [ ] Test backend API endpoint
- [ ] Test frontend
- [ ] Verify database connection

## Post-Deployment

- [ ] Set up CloudWatch monitoring
- [ ] Configure auto-scaling (if needed)
- [ ] Set up backup strategy for RDS
- [ ] Configure domain and SSL certificate
- [ ] Test all functionality

## AWS CLI Commands

```bash
# Check ECS service status
aws ecs describe-services --cluster <cluster> --services <service>

# View logs
aws logs tail /ecs/<task-definition> --follow

# Run one-off task
aws ecs run-task --cluster <cluster> --task-definition <task-def>
```

## Troubleshooting

- **RDS connection fails**: Check security group rules
- **ECS tasks fail**: Check CloudWatch logs
- **Build fails**: Verify Dockerfile and build context
- **Migrations fail**: Check database connectivity and credentials

