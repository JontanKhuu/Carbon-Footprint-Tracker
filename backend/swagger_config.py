"""
Swagger/OpenAPI configuration for API documentation
"""
SWAGGER_CONFIG = {
    "headers": [],
    "specs": [
        {
            "endpoint": "apispec",
            "route": "/api/apispec.json",
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "ui_params": {
        "deepLinking": True,
        "displayRequestDuration": True,
        "docExpansion": "list",
        "filter": True,
        "showExtensions": True,
        "showCommonExtensions": True,
    }
}

SWAGGER_TEMPLATE = {
    "swagger": "2.0",
    "info": {
        "title": "Carbon Footprint Tracker API",
        "description": "API documentation for the Carbon Footprint Tracker application. "
                       "Track and manage your carbon emissions with detailed analytics and reporting.",
        "version": "1.0.0",
        "contact": {
            "name": "API Support"
        }
    },
    "basePath": "/api",
    "schemes": ["http", "https"],
    "securityDefinitions": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "JWT Authorization header using the Bearer scheme. Enter your access_token from the login response. Format: Bearer {token} (Swagger UI will add 'Bearer ' prefix automatically)"
        }
    },
    # Remove global security - only endpoints with @token_required should require auth
    # "security": [
    #     {
    #         "Bearer": []
    #     }
    # ],
    "tags": [
        {
            "name": "Health",
            "description": "Health check endpoints"
        },
        {
            "name": "Users",
            "description": "User management and authentication endpoints"
        },
        {
            "name": "Emissions",
            "description": "Carbon emission tracking and management endpoints"
        }
    ]
}

