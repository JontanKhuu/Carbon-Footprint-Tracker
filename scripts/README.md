# Deployment Scripts

This directory contains helper scripts to facilitate deployment setup and verification.

## Available Scripts

### Environment Setup Scripts

#### `setup-env.sh` / `setup-env.ps1`
Automatically creates a `.env` file from `env.example` and generates secure values for:
- `SECRET_KEY` (using OpenSSL)
- `POSTGRES_PASSWORD` (random secure password)

**Usage:**
```bash
# Linux/Mac
./scripts/setup-env.sh

# Windows PowerShell
.\scripts\setup-env.ps1
```

**What it does:**
1. Checks if `.env` already exists (backs up if it does)
2. Copies `env.example` to `.env`
3. Generates secure `SECRET_KEY` using `openssl rand -hex 32`
4. Generates secure `POSTGRES_PASSWORD`
5. Updates `DATABASE_URL` with the generated password

**After running:**
- Review `.env` file
- Update `CORS_ORIGINS` with your production domain(s)
- Update `VITE_API_URL` with your production backend URL

---

### Environment Verification Scripts

#### `check-env.sh` / `check-env.ps1`
Verifies that all required environment variables are set and checks for security issues.

**Usage:**
```bash
# Linux/Mac
./scripts/check-env.sh

# Windows PowerShell
.\scripts\check-env.ps1
```

**What it checks:**
- ✅ All required variables are present
- ✅ No placeholder values remain
- ✅ `SECRET_KEY` is not using default value
- ✅ `POSTGRES_PASSWORD` is not using placeholder/default
- ⚠️ Warns if `CORS_ORIGINS` or `VITE_API_URL` contain placeholders

**Exit codes:**
- `0` - All checks passed (may have warnings)
- `1` - Errors found (missing variables or security issues)

---

### Database Scripts

#### `test-db-connection.sh` / `test-db-connection.ps1`
Tests the connection to the PostgreSQL database using the `DATABASE_URL` from `.env`.

**Usage:**
```bash
# Linux/Mac
./scripts/test-db-connection.sh

# Windows PowerShell
.\scripts\test-db-connection.ps1
```

**What it does:**
- Parses `DATABASE_URL` from `.env`
- Tests connection to PostgreSQL database
- Displays database version and name if successful
- Provides troubleshooting tips if connection fails

**Requirements:**
- `psql` (PostgreSQL client) OR
- `psycopg2-binary` Python package (`pip install psycopg2-binary`)

---

#### `backup-database.sh` / `backup-database.ps1`
Creates a backup of the PostgreSQL database.

**Usage:**
```bash
# Linux/Mac
./scripts/backup-database.sh [output_directory] [backup_name]

# Windows PowerShell
.\scripts\backup-database.ps1 [-OutputPath "backups"] [-BackupName "custom_name.sql"]
```

**Examples:**
```bash
# Default backup (creates in ./backups/ with timestamp)
./scripts/backup-database.sh

# Custom location
./scripts/backup-database.sh /path/to/backups

# Custom name
./scripts/backup-database.sh backups my_backup.sql
```

**What it does:**
- Creates a SQL dump of the database
- Automatically detects Docker vs. direct connection
- Generates timestamped backup files
- Shows backup file size and location

**Backup file format:**
- `backup_<database_name>_<timestamp>.sql`

**To restore a backup:**
```bash
# Docker
docker-compose exec -T db psql -U postgres -d carbon_footprint < backup.sql

# Direct connection
psql -h <host> -U <user> -d <database> < backup.sql
```

---

#### `create-database.sh` / `create-database.ps1`
Creates the PostgreSQL database if it doesn't exist.

**Usage:**
```bash
# Linux/Mac
./scripts/create-database.sh

# Windows PowerShell
.\scripts\create-database.ps1
```

**What it does:**
- Checks if database already exists
- Creates database if it doesn't exist
- For Docker setups, confirms database will be auto-created
- Provides manual instructions for non-Docker setups

**Note:** For Docker deployments, the database is automatically created when containers start using the `POSTGRES_DB` environment variable.

---

### Docker Deployment Scripts

#### `docker-build.sh` / `docker-build.ps1`
Builds all Docker images for production deployment.

**Usage:**
```bash
# Linux/Mac
./scripts/docker-build.sh [compose-file]

# Windows PowerShell
.\scripts\docker-build.ps1 [-ComposeFile "docker-compose.prod.yml"] [-NoCache]
```

**Examples:**
```bash
# Build with cache (default)
./scripts/docker-build.sh

# Build without cache (clean build)
.\scripts\docker-build.ps1 -NoCache

# Use custom compose file
./scripts/docker-build.sh docker-compose.custom.yml
```

**What it does:**
- Builds all Docker images defined in docker-compose file
- Validates Docker installation and compose file
- Checks for .env file
- Provides next steps after successful build

---

#### `docker-start.sh` / `docker-start.ps1`
Starts all Docker containers for production deployment.

**Usage:**
```bash
# Linux/Mac
./scripts/docker-start.sh [compose-file] [--build]

# Windows PowerShell
.\scripts\docker-start.ps1 [-ComposeFile "docker-compose.prod.yml"] [-Build]
```

**Examples:**
```bash
# Start containers
./scripts/docker-start.sh

# Start and rebuild images
.\scripts\docker-start.ps1 -Build

# Use custom compose file
./scripts/docker-start.sh docker-compose.prod.yml
```

**What it does:**
- Starts all containers in detached mode (`-d`)
- Waits for services to be healthy
- Shows container status
- Provides next steps (logs, migrations, health check)

---

#### `docker-status.sh` / `docker-status.ps1`
Checks the status of all Docker containers and health endpoints.

**Usage:**
```bash
# Linux/Mac
./scripts/docker-status.sh [compose-file]

# Windows PowerShell
.\scripts\docker-status.ps1 [-ComposeFile "docker-compose.prod.yml"]
```

**What it does:**
- Lists all containers and their states
- Checks backend API health endpoint
- Verifies database connection status
- Provides troubleshooting tips if issues found

**Exit codes:**
- `0` - All containers running and healthy
- `1` - Some containers not running or health checks failed

---

#### `docker-logs.sh` / `docker-logs.ps1`
Shows logs from Docker containers.

**Usage:**
```bash
# Linux/Mac
./scripts/docker-logs.sh [compose-file] [service] [--follow] [tail-lines]

# Windows PowerShell
.\scripts\docker-logs.ps1 [-ComposeFile "docker-compose.prod.yml"] [-Service "backend"] [-Follow] [-Tail 100]
```

**Examples:**
```bash
# Show last 100 lines from all services
./scripts/docker-logs.sh

# Follow backend logs
./scripts/docker-logs.sh docker-compose.prod.yml backend --follow

# Show last 50 lines from frontend
.\scripts\docker-logs.ps1 -Service frontend -Tail 50
```

**What it does:**
- Shows container logs (all services or specific service)
- Supports following logs in real-time
- Configurable number of lines to show
- Useful for debugging deployment issues

---

#### `docker-migrate.sh` / `docker-migrate.ps1`
Runs database migrations in the backend container.

**Usage:**
```bash
# Linux/Mac
./scripts/docker-migrate.sh [compose-file] [action]

# Windows PowerShell
.\scripts\docker-migrate.ps1 [-ComposeFile "docker-compose.prod.yml"] [-Action "upgrade"]
```

**Actions:**
- `upgrade` - Apply all pending migrations (default)
- `downgrade` - Rollback last migration
- `current` - Show current migration version
- `history` - Show migration history

**Examples:**
```bash
# Run migrations
./scripts/docker-migrate.sh

# Check current migration version
.\scripts\docker-migrate.ps1 -Action current

# Rollback last migration
./scripts/docker-migrate.sh docker-compose.prod.yml downgrade
```

**What it does:**
- Runs Flask-Migrate commands in backend container
- Verifies backend container is running
- Provides troubleshooting tips on failure

---

### Cloud Platform Deployment Guides

#### `cloud-deploy-railway.md`
Complete deployment checklist and guide for Railway platform.

**Includes:**
- Step-by-step deployment instructions
- Environment variable configuration
- Database setup
- Migration commands
- Troubleshooting tips

**Usage:** Follow the checklist in the file when deploying to Railway.

---

#### `cloud-deploy-render.md`
Complete deployment checklist and guide for Render platform.

**Includes:**
- Step-by-step deployment instructions
- Environment variable configuration
- Database setup
- Migration commands
- Troubleshooting tips

**Usage:** Follow the checklist in the file when deploying to Render.

---

#### `cloud-deploy-aws.md`
Complete deployment checklist and guide for AWS (EC2/ECS).

**Includes:**
- EC2 deployment steps
- ECS deployment steps
- RDS database setup
- ECR image management
- Troubleshooting tips

**Usage:** Follow the checklist in the file when deploying to AWS.

---

### Cloud Platform Scripts

#### `cloud-verify-health.sh` / `cloud-verify-health.ps1`
Verifies that deployed cloud services are healthy.

**Usage:**
```bash
# Linux/Mac
./scripts/cloud-verify-health.sh <backend-url> [frontend-url]

# Windows PowerShell
.\scripts\cloud-verify-health.ps1 -BackendUrl "https://backend.railway.app" -FrontendUrl "https://frontend.railway.app"
```

**Examples:**
```bash
# Check both services
./scripts/cloud-verify-health.sh https://backend.railway.app https://frontend.railway.app

# Check backend only
.\scripts\cloud-verify-health.ps1 -BackendUrl "https://backend.onrender.com"
```

**What it does:**
- Tests backend API health endpoint
- Checks database connection status
- Verifies frontend accessibility
- Provides troubleshooting tips if issues found

---

#### `cloud-migrate-railway.sh` / `cloud-migrate-railway.ps1`
Runs database migrations on Railway platform.

**Usage:**
```bash
# Linux/Mac
./scripts/cloud-migrate-railway.sh [service-name]

# Windows PowerShell
.\scripts\cloud-migrate-railway.ps1 [-ServiceName "backend"]
```

**Prerequisites:**
- Railway CLI installed: `npm i -g @railway/cli`
- Logged in: `railway login`
- Project linked: `railway link`

**What it does:**
- Runs `flask db upgrade` in Railway backend service
- Verifies Railway CLI is installed
- Provides troubleshooting tips on failure

---

## Quick Start

1. **Set up environment file:**
   ```bash
   # Windows
   .\scripts\setup-env.ps1
   
   # Linux/Mac
   ./scripts/setup-env.sh
   ```

2. **Edit `.env` file:**
   - Update `CORS_ORIGINS` with your domain(s)
   - Update `VITE_API_URL` with your API URL

3. **Verify environment:**
   ```bash
   # Windows
   .\scripts\check-env.ps1
   
   # Linux/Mac
   ./scripts/check-env.sh
   ```

4. **Fix any issues reported by the verification script**

5. **Test database connection:**
   ```bash
   # Windows
   .\scripts\test-db-connection.ps1
   
   # Linux/Mac
   ./scripts/test-db-connection.sh
   ```

6. **Create database backup (before deployment):**
   ```bash
   # Windows
   .\scripts\backup-database.ps1
   
   # Linux/Mac
   ./scripts/backup-database.sh
   ```

7. **Build Docker images:**
   ```bash
   # Windows
   .\scripts\docker-build.ps1
   
   # Linux/Mac
   ./scripts/docker-build.sh
   ```

8. **Start Docker containers:**
   ```bash
   # Windows
   .\scripts\docker-start.ps1
   
   # Linux/Mac
   ./scripts/docker-start.sh
   ```

9. **Check container status:**
   ```bash
   # Windows
   .\scripts\docker-status.ps1
   
   # Linux/Mac
   ./scripts/docker-status.sh
   ```

10. **Run database migrations:**
    ```bash
    # Windows
    .\scripts\docker-migrate.ps1
    
    # Linux/Mac
    ./scripts/docker-migrate.sh
    ```

### Cloud Platform Deployment

1. **Choose your platform:**
   - Railway: Follow `scripts/cloud-deploy-railway.md`
   - Render: Follow `scripts/cloud-deploy-render.md`
   - AWS: Follow `scripts/cloud-deploy-aws.md`

2. **Run migrations (Railway):**
   ```bash
   # Install Railway CLI first
   npm i -g @railway/cli
   railway login
   railway link
   
   # Run migrations
   ./scripts/cloud-migrate-railway.sh
   ```

3. **Verify deployment:**
   ```bash
   # Windows
   .\scripts\cloud-verify-health.ps1 -BackendUrl "https://your-backend.railway.app" -FrontendUrl "https://your-frontend.railway.app"
   
   # Linux/Mac
   ./scripts/cloud-verify-health.sh https://your-backend.railway.app https://your-frontend.railway.app
   ```

---

## Requirements

### For Environment Scripts
- **OpenSSL** (for `setup-env.sh` on Linux/Mac) - Usually pre-installed
- **PowerShell 5.1+** (for `setup-env.ps1` on Windows) - Pre-installed on Windows 10+

If OpenSSL is not available, the scripts will warn you and you'll need to generate the `SECRET_KEY` manually:
```bash
openssl rand -hex 32
```

### For Database Scripts
- **PostgreSQL client tools** (`psql`, `pg_dump`) OR
- **Python with psycopg2-binary** (`pip install psycopg2-binary`)

**Installation:**
- **Ubuntu/Debian:** `sudo apt-get install postgresql-client`
- **macOS:** `brew install postgresql`
- **Windows:** Install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/) or use Docker

### For Docker Scripts
- **Docker** and **Docker Compose** installed and running
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)

**Installation:**
- **Windows/Mac:** [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Ubuntu/Debian:** `sudo apt-get install docker.io docker-compose`
- **macOS:** `brew install docker docker-compose`

---

## Notes

- All scripts preserve existing `.env` files by creating backups
- Scripts are idempotent (safe to run multiple times)
- `.env` file is in `.gitignore` and should never be committed
- Always review generated values before deployment

