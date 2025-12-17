from flask import Blueprint, request, jsonify
from app import db
from app.models.emission import Emission
from app.models.emission_history import EmissionHistory
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
from app.utils.jwt import token_required

emissions_bp = Blueprint('emissions', __name__)


@emissions_bp.route('', methods=['GET'])
@token_required
def get_emissions(current_user):
    """
    Get All Emissions
    ---
    tags:
      - Emissions
    summary: Retrieve all emissions for the authenticated user
    description: Returns a list of all emission records for the current user with optional filtering
    security:
      - Bearer: []
    parameters:
      - name: category
        in: query
        type: string
        required: false
        description: Filter by category (e.g., transport, energy, food)
      - name: start_date
        in: query
        type: string
        format: date
        required: false
        description: Filter emissions from this date (ISO format)
      - name: end_date
        in: query
        type: string
        format: date
        required: false
        description: Filter emissions until this date (ISO format)
    responses:
      200:
        description: List of emissions
        schema:
          type: array
          items:
            type: object
            properties:
              id:
                type: integer
              user_id:
                type: integer
              category:
                type: string
              activity:
                type: string
              amount:
                type: number
              unit:
                type: string
              co2_equivalent:
                type: number
              emission_factor:
                type: number
              date:
                type: string
                format: date
              description:
                type: string
              created_at:
                type: string
                format: date-time
              updated_at:
                type: string
                format: date-time
      401:
        description: Unauthorized - Invalid or missing token
    """
    # Use current_user's ID instead of user_id from query params for security
    user_id = current_user.id
    category = request.args.get('category')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = Emission.query.filter_by(user_id=user_id)
    
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
    """
    Get Supported Activities
    ---
    tags:
      - Emissions
    summary: Get list of supported activities and emission factors
    description: Returns all supported emission activities, their emission factors, and expected units. Optionally filtered by category.
    parameters:
      - name: category
        in: query
        type: string
        required: false
        description: Filter by category (e.g., transport, energy, food)
    responses:
      200:
        description: Supported activities grouped by category
        schema:
          type: object
          additionalProperties:
            type: object
            properties:
              activities:
                type: array
                items:
                  type: string
              emission_factors:
                type: object
                additionalProperties:
                  type: number
              expected_units:
                type: object
                additionalProperties:
                  type: string
        examples:
          application/json:
            transport:
              activities: ["car_drive", "plane_flight", "train_ride"]
              emission_factors:
                car_drive: 0.171
                plane_flight: 0.255
                train_ride: 0.041
              expected_units:
                car_drive: "km"
                plane_flight: "km"
                train_ride: "km"
    """
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
@token_required
def get_emission_stats(current_user):
    """
    Get Emission Statistics
    ---
    tags:
      - Emissions
    summary: Get emission statistics for the authenticated user
    description: Returns aggregated statistics including total CO2 equivalent, record count, and breakdown by category
    security:
      - Bearer: []
    parameters:
      - name: start_date
        in: query
        type: string
        format: date
        required: false
        description: Filter statistics from this date (ISO format)
      - name: end_date
        in: query
        type: string
        format: date
        required: false
        description: Filter statistics until this date (ISO format)
    responses:
      200:
        description: Emission statistics
        schema:
          type: object
          properties:
            total_co2_equivalent:
              type: number
              description: Total CO2 equivalent in kg
              example: 1250.5
            total_records:
              type: integer
              description: Total number of emission records
              example: 45
            by_category:
              type: array
              items:
                type: object
                properties:
                  category:
                    type: string
                  total_co2_equivalent:
                    type: number
                  count:
                    type: integer
        examples:
          application/json:
            total_co2_equivalent: 1250.5
            total_records: 45
            by_category:
              - category: transport
                total_co2_equivalent: 850.2
                count: 20
              - category: energy
                total_co2_equivalent: 400.3
                count: 25
      401:
        description: Unauthorized - Invalid or missing token
    """
    # Use current_user's ID for security
    user_id = current_user.id
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = Emission.query.filter_by(user_id=user_id)
    
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
    ).filter_by(user_id=user_id).group_by(Emission.category)
    
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


@emissions_bp.route('/<int:emission_id>/history', methods=['GET'])
@token_required
def get_emission_history(emission_id, current_user):
    """
    Get Emission Edit History
    ---
    tags:
      - Emissions
    summary: Get edit history for a specific emission
    description: Returns the complete edit history for an emission record, showing all changes over time
    security:
      - Bearer: []
    parameters:
      - name: emission_id
        in: path
        type: integer
        required: true
        description: The ID of the emission record
    responses:
      200:
        description: List of history entries
        schema:
          type: array
          items:
            type: object
            properties:
              id:
                type: integer
              emission_id:
                type: integer
              old_category:
                type: string
              new_category:
                type: string
              old_activity:
                type: string
              new_activity:
                type: string
              old_amount:
                type: number
              new_amount:
                type: number
              changed_at:
                type: string
                format: date-time
      401:
        description: Unauthorized - Invalid or missing token
      403:
        description: Forbidden - Emission does not belong to current user
      404:
        description: Emission not found
    """
    # Verify emission exists and belongs to current user
    emission = Emission.query.get_or_404(emission_id)
    
    if emission.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Get all history entries for this emission, ordered by most recent first
    history_entries = EmissionHistory.query.filter_by(emission_id=emission_id)\
        .order_by(EmissionHistory.changed_at.desc()).all()
    
    return jsonify([entry.to_dict() for entry in history_entries]), 200


@emissions_bp.route('/<int:emission_id>', methods=['GET'])
@token_required
def get_emission(emission_id, current_user):
    """
    Get Emission by ID
    ---
    tags:
      - Emissions
    summary: Retrieve a specific emission record
    description: Returns detailed information about a specific emission record
    security:
      - Bearer: []
    parameters:
      - name: emission_id
        in: path
        type: integer
        required: true
        description: The ID of the emission record
    responses:
      200:
        description: Emission record details
        schema:
          type: object
          properties:
            id:
              type: integer
            user_id:
              type: integer
            category:
              type: string
            activity:
              type: string
            amount:
              type: number
            unit:
              type: string
            co2_equivalent:
              type: number
            emission_factor:
              type: number
            date:
              type: string
              format: date
            description:
              type: string
            created_at:
              type: string
              format: date-time
            updated_at:
              type: string
              format: date-time
      401:
        description: Unauthorized - Invalid or missing token
      403:
        description: Forbidden - Emission does not belong to current user
      404:
        description: Emission not found
    """
    emission = Emission.query.get_or_404(emission_id)
    
    # Verify emission belongs to current user
    if emission.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    return jsonify(emission.to_dict()), 200


@emissions_bp.route('', methods=['POST'])
@token_required
def create_emission(current_user):
    """
    Create New Emission
    ---
    tags:
      - Emissions
    summary: Create a new emission record
    description: Creates a new carbon emission record. CO2 equivalent is automatically calculated if not provided.
    security:
      - Bearer: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - category
            - activity
            - amount
            - unit
            - date
          properties:
            category:
              type: string
              example: transport
              description: Emission category (e.g., transport, energy, food)
            activity:
              type: string
              example: car_drive
              description: Activity type (e.g., car_drive, electricity_usage)
            amount:
              type: number
              example: 100
              description: Amount of the activity
            unit:
              type: string
              example: km
              description: Unit of measurement (e.g., km, kWh, kg)
            date:
              type: string
              format: date
              example: "2024-01-15"
              description: Date of the emission (ISO format)
            description:
              type: string
              example: Daily commute to work
              description: Optional description
            co2_equivalent:
              type: number
              example: 17.1
              description: CO2 equivalent in kg (optional, will be calculated if not provided)
            emission_factor:
              type: number
              example: 0.171
              description: Emission factor used (optional, will be calculated if not provided)
    responses:
      201:
        description: Emission created successfully
        schema:
          type: object
          properties:
            id:
              type: integer
            user_id:
              type: integer
            category:
              type: string
            activity:
              type: string
            amount:
              type: number
            unit:
              type: string
            co2_equivalent:
              type: number
            emission_factor:
              type: number
            date:
              type: string
              format: date
            description:
              type: string
            created_at:
              type: string
              format: date-time
            updated_at:
              type: string
              format: date-time
      400:
        description: Validation error or missing required fields
        schema:
          type: object
          properties:
            error:
              type: string
            message:
              type: string
      401:
        description: Unauthorized - Invalid or missing token
    """
    data = request.get_json()
    
    # Required fields (user_id is now taken from token, co2_equivalent and emission_factor are optional)
    required_fields = ['category', 'activity', 'amount', 'unit', 'date']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields: category, activity, amount, unit, date'}), 400
    
    try:
        # Use current_user's ID instead of user_id from request for security
        user_id = current_user.id
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
@token_required
def update_emission(emission_id, current_user):
    """
    Update Emission
    ---
    tags:
      - Emissions
    summary: Update an existing emission record
    description: Updates an emission record. Changes are tracked in history. Only provided fields are updated.
    security:
      - Bearer: []
    parameters:
      - name: emission_id
        in: path
        type: integer
        required: true
        description: The ID of the emission record to update
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            category:
              type: string
              example: transport
            activity:
              type: string
              example: car_drive
            amount:
              type: number
              example: 150
            unit:
              type: string
              example: km
            date:
              type: string
              format: date
              example: "2024-01-20"
            description:
              type: string
              example: Updated description
            co2_equivalent:
              type: number
              example: 25.65
            emission_factor:
              type: number
              example: 0.171
    responses:
      200:
        description: Emission updated successfully
        schema:
          type: object
          properties:
            id:
              type: integer
            user_id:
              type: integer
            category:
              type: string
            activity:
              type: string
            amount:
              type: number
            unit:
              type: string
            co2_equivalent:
              type: number
            emission_factor:
              type: number
            date:
              type: string
              format: date
            description:
              type: string
            created_at:
              type: string
              format: date-time
            updated_at:
              type: string
              format: date-time
      400:
        description: Validation error
      401:
        description: Unauthorized - Invalid or missing token
      403:
        description: Forbidden - Emission does not belong to current user
      404:
        description: Emission not found
    """
    emission = Emission.query.get_or_404(emission_id)
    
    # Verify emission belongs to current user
    if emission.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    try:
        # Store old values for history
        old_values = {
            'category': emission.category,
            'activity': emission.activity,
            'amount': emission.amount,
            'unit': emission.unit,
            'co2_equivalent': emission.co2_equivalent,
            'emission_factor': emission.emission_factor,
            'date': emission.date,
            'description': emission.description
        }
        
        # Update fields
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
        
        # Store new values
        new_values = {
            'category': emission.category,
            'activity': emission.activity,
            'amount': emission.amount,
            'unit': emission.unit,
            'co2_equivalent': emission.co2_equivalent,
            'emission_factor': emission.emission_factor,
            'date': emission.date,
            'description': emission.description
        }
        
        # Check if there are any actual changes
        has_changes = (
            old_values['category'] != new_values['category'] or
            old_values['activity'] != new_values['activity'] or
            old_values['amount'] != new_values['amount'] or
            old_values['unit'] != new_values['unit'] or
            old_values['co2_equivalent'] != new_values['co2_equivalent'] or
            old_values['emission_factor'] != new_values['emission_factor'] or
            old_values['date'] != new_values['date'] or
            (old_values['description'] or '') != (new_values['description'] or '')
        )
        
        # Only create history entry if there are actual changes
        if has_changes:
            history = EmissionHistory(
                emission_id=emission_id,
                old_category=old_values['category'],
                old_activity=old_values['activity'],
                old_amount=old_values['amount'],
                old_unit=old_values['unit'],
                old_co2_equivalent=old_values['co2_equivalent'],
                old_emission_factor=old_values['emission_factor'],
                old_date=old_values['date'],
                old_description=old_values['description'],
                new_category=new_values['category'],
                new_activity=new_values['activity'],
                new_amount=new_values['amount'],
                new_unit=new_values['unit'],
                new_co2_equivalent=new_values['co2_equivalent'],
                new_emission_factor=new_values['emission_factor'],
                new_date=new_values['date'],
                new_description=new_values['description']
            )
            db.session.add(history)
        
        db.session.commit()
        return jsonify(emission.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@emissions_bp.route('/<int:emission_id>', methods=['DELETE'])
@token_required
def delete_emission(emission_id, current_user):
    """
    Delete Emission
    ---
    tags:
      - Emissions
    summary: Delete an emission record
    description: Permanently deletes an emission record
    security:
      - Bearer: []
    parameters:
      - name: emission_id
        in: path
        type: integer
        required: true
        description: The ID of the emission record to delete
    responses:
      200:
        description: Emission deleted successfully
        schema:
          type: object
          properties:
            message:
              type: string
              example: Emission deleted successfully
      401:
        description: Unauthorized - Invalid or missing token
      403:
        description: Forbidden - Emission does not belong to current user
      404:
        description: Emission not found
    """
    emission = Emission.query.get_or_404(emission_id)
    
    # Verify emission belongs to current user
    if emission.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    db.session.delete(emission)
    db.session.commit()
    
    return jsonify({'message': 'Emission deleted successfully'}), 200

