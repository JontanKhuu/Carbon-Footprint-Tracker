# Carbon Footprint Tracker

A full-stack web application for tracking and managing carbon emissions. Built with Python Flask backend, React frontend, PostgreSQL database, and deployed using Docker and CI/CD pipelines.

##  Tech Stack

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

##  Project Structure

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

##  Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

##📄 License

This project is licensed under the MIT License.

##  Additional Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)

