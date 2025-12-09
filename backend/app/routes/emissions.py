from flask import Blueprint, request, jsonify
from app import db
from app.models.emission import Emission
from datetime import datetime
from sqlalchemy import func
from app.services.emission_calculator import (
    calculate_co2_equivalent,
    is_activity_supported,
    get_supported_activities,
    get_all_emission_factors,
    get_expected_unit,
    EmissionCalculatorError
)

emissions_bp = Blueprint('emissions', __name__)


@emissions_bp.route('', methods=['GET'])
def get_emissions():
    """Get all emissions with optional filtering"""
    user_id = request.args.get('user_id', type=int)
    category = request.args.get('category')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = Emission.query
    
    if user_id:
        query = query.filter_by(user_id=user_id)
    if category:
        query = query.filter_by(category=category)
    if start_date:
        query = query.filter(Emission.date >= datetime.fromisoformat(start_date).date())
    if end_date:
        query = query.filter(Emission.date <= datetime.fromisoformat(end_date).date())
    
    emissions = query.order_by(Emission.date.desc()).all()
    return jsonify([emission.to_dict() for emission in emissions]), 200


@emissions_bp.route('/activities', methods=['GET'])
def get_activities():
    """Get supported activities and their emission factors"""
    category = request.args.get('category')
    
    if category:
        activities = get_supported_activities(category)
    else:
        activities = get_supported_activities()
    
    emission_factors = get_all_emission_factors()
    
    # Build response with activities, their factors, and expected units
    response = {}
    for cat, activity_list in activities.items():
        response[cat] = {
            'activities': activity_list,
            'emission_factors': {
                activity: emission_factors[cat][activity]
                for activity in activity_list
            },
            'expected_units': {
                activity: get_expected_unit(cat, activity) or 'kg'
                for activity in activity_list
            }
        }
    
    return jsonify(response), 200


@emissions_bp.route('/stats', methods=['GET'])
def get_emission_stats():
    """Get emission statistics"""
    user_id = request.args.get('user_id', type=int)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = Emission.query
    
    if user_id:
        query = query.filter_by(user_id=user_id)
    if start_date:
        query = query.filter(Emission.date >= datetime.fromisoformat(start_date).date())
    if end_date:
        query = query.filter(Emission.date <= datetime.fromisoformat(end_date).date())
    
    total_co2 = query.with_entities(func.sum(Emission.co2_equivalent)).scalar() or 0
    count = query.count()
    
    # Group by category
    category_stats = db.session.query(
        Emission.category,
        func.sum(Emission.co2_equivalent).label('total_co2'),
        func.count(Emission.id).label('count')
    ).group_by(Emission.category)
    
    if user_id:
        category_stats = category_stats.filter_by(user_id=user_id)
    if start_date:
        category_stats = category_stats.filter(Emission.date >= datetime.fromisoformat(start_date).date())
    if end_date:
        category_stats = category_stats.filter(Emission.date <= datetime.fromisoformat(end_date).date())
    
    category_stats = category_stats.all()
    
    return jsonify({
        'total_co2_equivalent': float(total_co2),
        'total_records': count,
        'by_category': [
            {
                'category': stat.category,
                'total_co2_equivalent': float(stat.total_co2),
                'count': stat.count
            }
            for stat in category_stats
        ]
    }), 200


@emissions_bp.route('/<int:emission_id>', methods=['GET'])
def get_emission(emission_id):
    """Get a specific emission by ID"""
    emission = Emission.query.get_or_404(emission_id)
    return jsonify(emission.to_dict()), 200


@emissions_bp.route('', methods=['POST'])
def create_emission():
    """Create a new emission record"""
    data = request.get_json()
    
    # Required fields (co2_equivalent and emission_factor are now optional)
    required_fields = ['user_id', 'category', 'activity', 'amount', 'unit', 'date']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields: user_id, category, activity, amount, unit, date'}), 400
    
    try:
        # Extract required fields
        user_id = data['user_id']
        category = data['category']
        activity = data['activity']
        amount = float(data['amount'])
        unit = data['unit']
        date = datetime.fromisoformat(data['date']).date() if isinstance(data['date'], str) else data['date']
        description = data.get('description')
        
        # Validate amount
        if amount <= 0:
            return jsonify({'error': 'Amount must be greater than 0'}), 400
        
        # Calculate CO2 equivalent if not provided
        if 'co2_equivalent' in data and 'emission_factor' in data:
            # Use provided values
            co2_equivalent = float(data['co2_equivalent'])
            emission_factor = float(data['emission_factor'])
            
            if co2_equivalent < 0:
                return jsonify({'error': 'CO2 equivalent cannot be negative'}), 400
            if emission_factor < 0:
                return jsonify({'error': 'Emission factor cannot be negative'}), 400
        else:
            # Try to calculate using the emission calculator
            try:
                co2_equivalent, emission_factor = calculate_co2_equivalent(
                    category=category,
                    activity=activity,
                    amount=amount,
                    unit=unit
                )
            except EmissionCalculatorError as e:
                return jsonify({
                    'error': str(e),
                    'message': 'Please provide co2_equivalent and emission_factor manually for this activity.'
                }), 400
        
        # Create emission record
        emission = Emission(
            user_id=user_id,
            category=category,
            activity=activity,
            amount=amount,
            unit=unit,
            co2_equivalent=co2_equivalent,
            emission_factor=emission_factor,
            date=date,
            description=description
        )
        
        db.session.add(emission)
        db.session.commit()
        
        return jsonify(emission.to_dict()), 201
    except ValueError as e:
        db.session.rollback()
        return jsonify({'error': f'Invalid value: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@emissions_bp.route('/<int:emission_id>', methods=['PUT'])
def update_emission(emission_id):
    """Update an existing emission record"""
    emission = Emission.query.get_or_404(emission_id)
    data = request.get_json()
    
    try:
        if 'category' in data:
            emission.category = data['category']
        if 'activity' in data:
            emission.activity = data['activity']
        if 'amount' in data:
            emission.amount = float(data['amount'])
        if 'unit' in data:
            emission.unit = data['unit']
        if 'co2_equivalent' in data:
            emission.co2_equivalent = float(data['co2_equivalent'])
        if 'emission_factor' in data:
            emission.emission_factor = float(data['emission_factor'])
        if 'date' in data:
            emission.date = datetime.fromisoformat(data['date']).date() if isinstance(data['date'], str) else data['date']
        if 'description' in data:
            emission.description = data['description']
        
        db.session.commit()
        return jsonify(emission.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@emissions_bp.route('/<int:emission_id>', methods=['DELETE'])
def delete_emission(emission_id):
    """Delete an emission record"""
    emission = Emission.query.get_or_404(emission_id)
    
    db.session.delete(emission)
    db.session.commit()
    
    return jsonify({'message': 'Emission deleted successfully'}), 200

