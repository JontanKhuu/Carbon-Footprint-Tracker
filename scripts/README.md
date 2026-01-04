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

---

## Notes

- All scripts preserve existing `.env` files by creating backups
- Scripts are idempotent (safe to run multiple times)
- `.env` file is in `.gitignore` and should never be committed
- Always review generated values before deployment

