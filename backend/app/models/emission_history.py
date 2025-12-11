from datetime import datetime, timezone
from app import db


class EmissionHistory(db.Model):
    """Track edit history for emissions"""
    __tablename__ = 'emission_history'
    
    id = db.Column(db.Integer, primary_key=True)
    emission_id = db.Column(db.Integer, db.ForeignKey('emissions.id'), nullable=False, index=True)
    
    # Store the state before the change
    old_category = db.Column(db.String(100))
    old_activity = db.Column(db.String(200))
    old_amount = db.Column(db.Float)
    old_unit = db.Column(db.String(50))
    old_co2_equivalent = db.Column(db.Float)
    old_emission_factor = db.Column(db.Float)
    old_date = db.Column(db.Date)
    old_description = db.Column(db.Text)
    
    # Store the state after the change
    new_category = db.Column(db.String(100))
    new_activity = db.Column(db.String(200))
    new_amount = db.Column(db.Float)
    new_unit = db.Column(db.String(50))
    new_co2_equivalent = db.Column(db.Float)
    new_emission_factor = db.Column(db.Float)
    new_date = db.Column(db.Date)
    new_description = db.Column(db.Text)
    
    # Metadata
    changed_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    def to_dict(self):
        """Convert history entry to dictionary"""
        changes = []
        
        # Track which fields changed
        if self.old_category != self.new_category:
            changes.append({
                'field': 'category',
                'old_value': self.old_category,
                'new_value': self.new_category
            })
        if self.old_activity != self.new_activity:
            changes.append({
                'field': 'activity',
                'old_value': self.old_activity,
                'new_value': self.new_activity
            })
        if self.old_amount != self.new_amount:
            changes.append({
                'field': 'amount',
                'old_value': self.old_amount,
                'new_value': self.new_amount
            })
        if self.old_unit != self.new_unit:
            changes.append({
                'field': 'unit',
                'old_value': self.old_unit,
                'new_value': self.new_unit
            })
        if self.old_co2_equivalent != self.new_co2_equivalent:
            changes.append({
                'field': 'co2_equivalent',
                'old_value': self.old_co2_equivalent,
                'new_value': self.new_co2_equivalent
            })
        if self.old_emission_factor != self.new_emission_factor:
            changes.append({
                'field': 'emission_factor',
                'old_value': self.old_emission_factor,
                'new_value': self.new_emission_factor
            })
        if self.old_date != self.new_date:
            changes.append({
                'field': 'date',
                'old_value': self.old_date.isoformat() if self.old_date else None,
                'new_value': self.new_date.isoformat() if self.new_date else None
            })
        if self.old_description != self.new_description:
            changes.append({
                'field': 'description',
                'old_value': self.old_description,
                'new_value': self.new_description
            })
        
        return {
            'id': self.id,
            'emission_id': self.emission_id,
            'changed_at': self.changed_at.isoformat() if self.changed_at else None,
            'changes': changes
        }
    
    def __repr__(self):
        return f'<EmissionHistory {self.id}: emission {self.emission_id}>'

