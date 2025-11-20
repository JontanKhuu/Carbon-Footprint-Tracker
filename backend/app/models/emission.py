from datetime import datetime, timezone
from app import db


class Emission(db.Model):
    """Carbon emission tracking model"""
    __tablename__ = 'emissions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Emission data
    category = db.Column(db.String(100), nullable=False, index=True)  # e.g., 'transport', 'energy', 'food'
    activity = db.Column(db.String(200), nullable=False)  # e.g., 'car_drive', 'electricity_usage'
    amount = db.Column(db.Float, nullable=False)  # e.g., 100 (km, kWh, kg)
    unit = db.Column(db.String(50), nullable=False)  # e.g., 'km', 'kWh', 'kg'
    co2_equivalent = db.Column(db.Float, nullable=False)  # CO2 equivalent in kg
    emission_factor = db.Column(db.Float, nullable=False)  # Emission factor used for calculation
    
    # Metadata
    date = db.Column(db.Date, nullable=False, index=True)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    def to_dict(self):
        """Convert emission to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'category': self.category,
            'activity': self.activity,
            'amount': self.amount,
            'unit': self.unit,
            'co2_equivalent': self.co2_equivalent,
            'emission_factor': self.emission_factor,
            'date': self.date.isoformat() if self.date else None,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Emission {self.id}: {self.category} - {self.co2_equivalent} kg CO2>'

