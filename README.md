# Carbon Footprint Tracker 🌱

A comprehensive full-stack web application for tracking, managing, and visualizing your carbon emissions. Built with modern technologies and best practices, featuring automatic CO2 calculations, data visualization, and secure authentication.

![Tech Stack](https://img.shields.io/badge/Python-3.12-blue)
![Tech Stack](https://img.shields.io/badge/React-19-blue)
![Tech Stack](https://img.shields.io/badge/PostgreSQL-16-blue)
![Tech Stack](https://img.shields.io/badge/Docker-Ready-green)

## ✨ Features

### Core Functionality
- 🔐 **Secure Authentication** - JWT-based authentication with refresh tokens
- 📊 **Emission Tracking** - Track emissions across multiple categories (transport, energy, food, waste, etc.)
- 🧮 **Automatic CO2 Calculation** - Built-in emission calculator with pre-configured emission factors
- 📈 **Data Visualization** - Interactive charts showing trends, categories, and comparisons
- 📅 **Time-based Analysis** - Filter by date ranges, view monthly/yearly comparisons
- 📤 **Data Export** - Export your emissions data in CSV or JSON format
- 🔍 **Advanced Filtering** - Filter emissions by category, date range, and more
- 📝 **Emission History** - Track changes to emission records over time

### User Experience
- 🎨 **Modern UI** - Clean, responsive interface built with React and TypeScript
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- 🔄 **Real-time Updates** - Instant feedback and data synchronization
- 🎯 **Dashboard Insights** - Comprehensive overview with statistics and trends
- 📊 **Interactive Charts** - Line charts, bar charts, and pie charts for data visualization
- ⚡ **Fast Performance** - Optimized with Vite and modern build tools

### Security & Reliability
- 🛡️ **Rate Limiting** - API protection against abuse
- 🔒 **Protected Routes** - Secure API endpoints with JWT authentication
- ✅ **Input Validation** - Comprehensive validation on both frontend and backend
- 🧪 **Comprehensive Testing** - Extensive test suite with high coverage
- 📚 **API Documentation** - Interactive Swagger/OpenAPI documentation

## 🏗️ Tech Stack

### Backend
- **Language**: Python 3.12
- **Framework**: Flask 3.1.2
- **Database**: PostgreSQL 16
- **ORM**: SQLAlchemy 2.0
- **Migrations**: Flask-Migrate (Alembic)
- **Authentication**: PyJWT
- **API Documentation**: Flasgger (Swagger/OpenAPI)
- **Rate Limiting**: Flask-Limiter
- **Testing**: pytest with coverage reporting
- **Data Science**: NumPy, SciPy, scikit-learn (for calculations)

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **HTTP Client**: Axios
- **Routing**: React Router 7
- **Charts**: Recharts 3.6
- **Styling**: CSS3 with modern features

### DevOps & Infrastructure
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx
- **CI/CD**: GitHub Actions
- **Deployment**: Supports Railway, Render, AWS, Heroku, VPS, and more

## 📁 Project Structure

```
carbon-footprint-tracker/
├── backend/
│   ├── app/
│   │   ├── models/              # Database models (User, Emission, EmissionHistory)
│   │   ├── routes/              # API endpoints (users, emissions, health)
│   │   ├── services/            # Business logic (emission_calculator)
│   │   ├── utils/               # Utilities (JWT, auth helpers)
│   │   └── tests/                # Comprehensive test suite
│   ├── migrations/              # Database migrations (Alembic)
│   ├── static/                  # Static files (Swagger customizations)
│   ├── config.py                # Configuration settings
│   ├── app.py                   # Application entry point
│   ├── requirements.txt         # Python dependencies
│   └── Dockerfile               # Backend container config
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable components (Layout, Charts, ProtectedRoute)
│   │   ├── contexts/            # React contexts (AuthContext)
│   │   ├── hooks/               # Custom hooks (useAuth)
│   │   ├── pages/               # Page components (Dashboard, Login, etc.)
│   │   ├── services/            # API client (api.ts)
│   │   ├── types/               # TypeScript type definitions
│   │   └── utils/               # Utility functions
│   ├── public/                  # Static assets
│   ├── package.json             # Node dependencies
│   ├── Dockerfile               # Frontend container config
│   └── nginx.conf               # Nginx configuration
├── nginx/                       # Production Nginx configuration
├── docker-compose.yml           # Development multi-container setup
├── docker-compose.prod.yml      # Production deployment configuration
├── env.example                  # Environment variables template
├── DEPLOYMENT.md                # Comprehensive deployment guide
├── DEPLOYMENT_CHECKLIST.md      # Deployment checklist
└── README.md                    # This file
```

## 🚀 Getting Started

### Prerequisites

- **Python** 3.12+
- **Node.js** 20+
- **PostgreSQL** 16+ (or use Docker)
- **Docker & Docker Compose** (recommended)

### Local Development Setup

#### Option 1: Using Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd carbon-footprint-tracker
   ```

2. **Create environment file**
   ```bash
   cp env.example .env
   # Edit .env with your configuration (optional for local dev)
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
   # Create .env file in backend/ directory
   DATABASE_URL=postgresql://postgres:postgres@localhost:5433/carbon_footprint
   SECRET_KEY=your-secret-key-here
   FLASK_ENV=development
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
   # Create .env file in frontend/ directory
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Run the frontend**
   ```bash
   npm run dev
   ```

## 📡 API Documentation

### Interactive API Docs

Visit http://localhost:5000/apidocs/ for interactive Swagger documentation with "Try it out" functionality.

### Key Endpoints

#### Authentication
- `POST /api/users` - Register new user
- `POST /api/users/login` - Login (returns JWT tokens)
- `POST /api/users/refresh` - Refresh access token
- `GET /api/users/me` - Get current user info (protected)

#### Emissions
- `GET /api/emissions` - Get all emissions (protected, filtered by user)
- `GET /api/emissions/<id>` - Get single emission (protected)
- `POST /api/emissions` - Create new emission (protected)
- `PUT /api/emissions/<id>` - Update emission (protected)
- `DELETE /api/emissions/<id>` - Delete emission (protected)
- `GET /api/emissions/stats` - Get emission statistics (protected)
- `GET /api/emissions/activities` - Get supported activities and emission factors
- `GET /api/emissions/<id>/history` - Get emission change history (protected)
- `GET /api/emissions/export` - Export emissions (CSV/JSON) (protected)

#### Query Parameters
- `category` - Filter by category (transport, energy, food, waste, other)
- `start_date` - Filter from date (ISO format: YYYY-MM-DD)
- `end_date` - Filter to date (ISO format: YYYY-MM-DD)
- `format` - Export format (csv or json)

### Authentication

All emission endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <access_token>
```

Tokens are automatically refreshed when they expire (handled by the frontend).

## 🧪 Testing

### Backend Tests

Run all tests:
```bash
cd backend
pytest
```

Run with coverage:
```bash
pytest --cov=app --cov-report=html
```

View coverage report:
```bash
# Open htmlcov/index.html in your browser
```

### Test Coverage

The test suite includes:
- ✅ Unit tests for models
- ✅ Integration tests for API endpoints
- ✅ Authentication and authorization tests
- ✅ Emission calculator service tests
- ✅ Error handling and edge case tests
- ✅ Rate limiting tests
- ✅ Database transaction tests

## 🐳 Docker Commands

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop all services
docker-compose down

# Rebuild after changes
docker-compose up -d --build

# Access backend container
docker-compose exec backend bash

# Run database migrations
docker-compose exec backend flask db upgrade

# Create new migration
docker-compose exec backend flask db migrate -m "Description"

# Access database
docker-compose exec db psql -U postgres -d carbon_footprint
```

## 🔄 Database Migrations

```bash
# Create a new migration
flask db migrate -m "Description of changes"

# Apply migrations
flask db upgrade

# Rollback last migration
flask db downgrade

# Show migration history
flask db history
```

## 🚢 Deployment

**📖 For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

The deployment guide covers:
- Docker-based deployment
- Cloud platforms (Railway, Render, AWS, Heroku)
- VPS deployment
- Frontend-only deployment (Vercel/Netlify)
- Post-deployment steps and troubleshooting

### Quick Start (Docker Compose Production)

1. **Copy environment file**
   ```bash
   cp env.example .env
   # Edit .env with your production values
   ```

2. **Deploy with production compose file**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

3. **Run database migrations**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend flask db upgrade
   ```

4. **Verify deployment**
   - Frontend: http://your-domain.com
   - Backend API: http://your-domain.com/api/health
   - API Docs: http://your-domain.com/apidocs/

**⚠️ Important**: Before deploying to production:
- Generate a secure `SECRET_KEY` (use `openssl rand -hex 32`)
- Set strong database passwords
- Configure CORS origins with your production domain(s)
- Set up SSL/HTTPS certificates
- Review the [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)

### Recommended Deployment Platforms

- **For Beginners**: Railway or Render (easiest setup, free tiers)
- **For Production**: AWS ECS or VPS with Docker (more control)
- **For Budget**: VPS with Docker Compose (~$5-10/month)

## 📝 Environment Variables

### Backend

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `FLASK_APP` | Flask application entry point | No | `app.py` |
| `FLASK_ENV` | Environment (development/production/testing) | No | `development` |
| `SECRET_KEY` | Secret key for JWT and sessions | **Yes** (production) | `dev-secret-key-change-in-production` |
| `DATABASE_URL` | PostgreSQL connection string | **Yes** | `postgresql://postgres:postgres@localhost:5433/carbon_footprint` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | No | `http://localhost:3000,http://localhost:5173` |
| `RATELIMIT_STORAGE_URL` | Redis URL for distributed rate limiting (optional) | No | - |
| `RATELIMIT_ENABLED` | Enable/disable rate limiting | No | `true` |

### Frontend

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_URL` | Backend API URL | **Yes** | `http://localhost:5000/api` |

### Docker Compose

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `POSTGRES_USER` | PostgreSQL username | No | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL password | **Yes** (production) | `postgres` |
| `POSTGRES_DB` | Database name | No | `carbon_footprint` |

See `env.example` for a complete template.

## 🎯 Features in Detail

### Emission Categories

The application supports tracking emissions across multiple categories:

- **Transport**: Car, plane, train, bus, motorcycle, bicycle
- **Energy**: Electricity, natural gas, heating oil, propane
- **Food**: Various food types with different emission factors
- **Waste**: Landfill, recycling, composting
- **Other**: Custom activities

### Automatic CO2 Calculation

The built-in emission calculator automatically converts activities to CO2 equivalent using scientifically-backed emission factors. Simply select the activity type and enter the amount - the system calculates the carbon footprint automatically.

### Data Visualization

- **Line Charts**: Track emissions over time (daily, weekly, monthly views)
- **Bar Charts**: Compare emissions by category
- **Pie Charts**: Visualize category distribution
- **Comparison Cards**: Month-over-month and year-over-year comparisons

### Export Functionality

Export your emissions data in:
- **CSV format**: For spreadsheet analysis
- **JSON format**: For programmatic access

Exports respect current filters (category, date range) and include all emission data.

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`pytest`)
6. Commit your changes (`git commit -m 'Add some amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Development Guidelines

- Follow PEP 8 for Python code
- Use TypeScript for frontend code
- Write tests for new features
- Update documentation as needed
- Follow existing code style and patterns

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Additional Resources

### Documentation
- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Vite Documentation](https://vitejs.dev/)

### Deployment Guides
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Comprehensive deployment guide
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Deployment checklist
- [DEPLOYMENT_QUICK_START.md](./DEPLOYMENT_QUICK_START.md) - Quick deployment reference

### Project Management
- [CURRENT_TASKS.md](./CURRENT_TASKS.md) - Current development tasks
- [TODO.md](./TODO.md) - Future features and improvements

## 🆘 Support

If you encounter any issues:

1. Check the [Deployment Guide](./DEPLOYMENT.md) for common issues
2. Review application logs
3. Verify environment variables are set correctly
4. Check the [Troubleshooting section](./DEPLOYMENT.md#troubleshooting)

## 🙏 Acknowledgments

Built with modern web technologies and best practices. Special thanks to the open-source community for the amazing tools and libraries that made this project possible.

---

**Made with ❤️ for a sustainable future** 🌍
