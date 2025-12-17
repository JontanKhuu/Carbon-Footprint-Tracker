# Carbon Footprint Tracker

A full-stack web application for tracking and managing carbon emissions. Built with Python Flask backend, React frontend, PostgreSQL database, and deployed using Docker and CI/CD pipelines.

## 🏗️ Tech Stack

### Backend
- **Language**: Python 3.12
- **Framework**: Flask
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Migrations**: Flask-Migrate (Alembic)
- **Testing**: pytest

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **HTTP Client**: Axios

### DevOps & Infrastructure
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **Cloud Deployment**: AWS (configurable)

## 📁 Project Structure

```
carbon-footprint-tracker/
├── backend/
│   ├── app/
│   │   ├── models/          # Database models
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   └── tests/           # Test files
│   ├── config.py            # Configuration settings
│   ├── app.py               # Application entry point
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile           # Backend container config
├── frontend/
│   ├── src/                 # React source code
│   ├── public/              # Static assets
│   ├── package.json         # Node dependencies
│   ├── Dockerfile           # Frontend container config
│   └── nginx.conf           # Nginx configuration
├── docker-compose.yml       # Multi-container setup
├── .github/
│   └── workflows/
│       └── ci-cd.yml        # CI/CD pipeline
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL 16+ (or use Docker)
- Docker & Docker Compose (optional but recommended)

### Local Development Setup

#### Option 1: Using Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd carbon-footprint-tracker
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Initialize database**
   ```bash
   docker-compose exec backend flask db upgrade
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health Check: http://localhost:5000/api/health
   - Swagger UI: http://localhost:5000/apidocs/

#### Option 2: Manual Setup

**Backend Setup:**

1. **Create virtual environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Initialize database**
   ```bash
   flask db init
   flask db migrate -m "Initial migration"
   flask db upgrade
   ```

5. **Run the backend**
   ```bash
   python app.py
   ```

**Frontend Setup:**

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Set up environment variables**
   ```bash
   # Create .env file with:
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Run the frontend**
   ```bash
   npm run dev
   ```

## 📡 API Endpoints

### Health Check
- `GET /api/health` - Check API health status

### Users
- `GET /api/users` - Get all users
- `GET /api/users/<id>` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/<id>` - Update user
- `DELETE /api/users/<id>` - Delete user

### Emissions
- `GET /api/emissions` - Get all emissions (with optional filters)
- `GET /api/emissions/<id>` - Get emission by ID
- `POST /api/emissions` - Create new emission record
- `PUT /api/emissions/<id>` - Update emission record
- `DELETE /api/emissions/<id>` - Delete emission record
- `GET /api/emissions/stats` - Get emission statistics

### Query Parameters for Emissions
- `user_id` - Filter by user ID
- `category` - Filter by category (e.g., 'transport', 'energy')
- `start_date` - Filter from date (ISO format)
- `end_date` - Filter to date (ISO format)

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest
```

Run with coverage:
```bash
pytest --cov=app --cov-report=html
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 🐳 Docker Commands

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild after changes
docker-compose up -d --build

# Access backend container
docker-compose exec backend bash

# Run database migrations
docker-compose exec backend flask db upgrade
```

## 🔄 Database Migrations

```bash
# Create a new migration
flask db migrate -m "Description of changes"

# Apply migrations
flask db upgrade

# Rollback last migration
flask db downgrade
```

## 🚢 Deployment

### AWS Deployment

The CI/CD pipeline is configured to deploy to AWS. Set up the following secrets in GitHub:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`

The pipeline will:
1. Run tests on push/PR
2. Build Docker images
3. Deploy to AWS (configure deployment steps in `.github/workflows/ci-cd.yml`)

### Manual Deployment

1. **Build Docker images**
   ```bash
   docker build -t carbon-footprint-backend ./backend
   docker build -t carbon-footprint-frontend ./frontend
   ```

2. **Push to container registry**
   ```bash
   docker tag carbon-footprint-backend <registry>/carbon-footprint-backend:latest
   docker push <registry>/carbon-footprint-backend:latest
   ```

3. **Deploy to your cloud provider**
   - Configure environment variables
   - Set up PostgreSQL database
   - Deploy containers

## 📝 Environment Variables

### Backend
- `FLASK_APP` - Flask application entry point
- `FLASK_ENV` - Environment (development/production/testing)
- `SECRET_KEY` - Secret key for session management
- `DATABASE_URL` - PostgreSQL connection string
- `CORS_ORIGINS` - Allowed CORS origins (comma-separated)
- `PORT` - Server port (default: 5000)

### Frontend
- `VITE_API_URL` - Backend API URL

### Docker Compose
- `POSTGRES_USER` - PostgreSQL username
- `POSTGRES_PASSWORD` - PostgreSQL password
- `POSTGRES_DB` - Database name

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Additional Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)

