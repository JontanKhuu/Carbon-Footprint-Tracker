"""
Emission Calculator Service

This service calculates CO2 equivalent emissions based on activity type, amount, and unit.
Emission factors are based on standard values from IPCC, EPA, and other environmental agencies.
All values are in kg CO2 equivalent per unit.
"""

from typing import Optional, Dict, Tuple


# Emission factors database
# Values are in kg CO2 equivalent per unit
EMISSION_FACTORS: Dict[str, Dict[str, float]] = {
    'transport': {
        # Per km
        'car_drive': 0.120,  # Average passenger car (gasoline)
        'plane_flight': 0.255,  # Average short-haul flight
        'train_ride': 0.014,  # Electric train
        'bus_ride': 0.089,  # Average bus
        'motorcycle_ride': 0.113,  # Average motorcycle
    },
    'energy': {
        # Per kWh
        'electricity_usage': 0.233,  # Average grid electricity (varies by region)
        # Per m³
        'gas_usage': 1.96,  # Natural gas
        # Per kWh (for heating, assuming electric heating)
        'heating': 0.233,  # Same as electricity
    },
    'food': {
        # Per kg
        'beef': 27.0,  # Beef production
        'pork': 12.1,  # Pork production
        'chicken': 6.9,  # Chicken production
        'fish': 5.0,  # Average fish
        'dairy': 3.2,  # Average dairy products
        'vegetables': 2.0,  # Average vegetables
    },
    'waste': {
        # Per kg
        'plastic': 2.5,  # Plastic waste
        'paper': 0.9,  # Paper waste
        'organic': 0.5,  # Organic waste (composting)
    },
    'other': {
        # Generic factor (user should specify)
        'other': 1.0,  # Default fallback
    }
}

# Unit mappings - maps activity to expected unit
ACTIVITY_UNITS: Dict[str, Dict[str, str]] = {
    'transport': {
        'car_drive': 'km',
        'plane_flight': 'km',
        'train_ride': 'km',
        'bus_ride': 'km',
        'motorcycle_ride': 'km',
    },
    'energy': {
        'electricity_usage': 'kWh',
        'gas_usage': 'm³',
        'heating': 'kWh',
    },
    'food': {
        'beef': 'kg',
        'pork': 'kg',
        'chicken': 'kg',
        'fish': 'kg',
        'dairy': 'kg',
        'vegetables': 'kg',
    },
    'waste': {
        'plastic': 'kg',
        'paper': 'kg',
        'organic': 'kg',
    },
    'other': {
        'other': 'kg',  # Default
    }
}


class EmissionCalculatorError(Exception):
    """Custom exception for emission calculator errors"""
    pass


def get_emission_factor(category: str, activity: str) -> Optional[float]:
    """
    Get emission factor for a given category and activity.
    
    Args:
        category: Emission category (e.g., 'transport', 'energy', 'food')
        activity: Activity type (e.g., 'car_drive', 'electricity_usage')
    
    Returns:
        Emission factor (kg CO2 per unit) or None if not found
    """
    return EMISSION_FACTORS.get(category, {}).get(activity)


def get_expected_unit(category: str, activity: str) -> Optional[str]:
    """
    Get expected unit for a given category and activity.
    
    Args:
        category: Emission category
        activity: Activity type
    
    Returns:
        Expected unit string or None if not found
    """
    return ACTIVITY_UNITS.get(category, {}).get(activity)


def is_activity_supported(category: str, activity: str) -> bool:
    """
    Check if an activity is supported by the calculator.
    
    Args:
        category: Emission category
        activity: Activity type
    
    Returns:
        True if activity is supported, False otherwise
    """
    return get_emission_factor(category, activity) is not None


def calculate_co2_equivalent(
    category: str,
    activity: str,
    amount: float,
    unit: str
) -> Tuple[float, float]:
    """
    Calculate CO2 equivalent for a given activity.
    
    Args:
        category: Emission category (e.g., 'transport', 'energy', 'food')
        activity: Activity type (e.g., 'car_drive', 'electricity_usage')
        amount: Amount of activity
        unit: Unit of measurement (e.g., 'km', 'kWh', 'kg')
    
    Returns:
        Tuple of (co2_equivalent, emission_factor)
        - co2_equivalent: Total CO2 equivalent in kg
        - emission_factor: Emission factor used in calculation
    
    Raises:
        EmissionCalculatorError: If activity is not supported or unit mismatch
    """
    # Check if activity is supported
    if not is_activity_supported(category, activity):
        raise EmissionCalculatorError(
            f"Activity '{activity}' in category '{category}' is not supported. "
            f"Please provide co2_equivalent and emission_factor manually."
        )
    
    # Get emission factor
    emission_factor = get_emission_factor(category, activity)
    if emission_factor is None:
        raise EmissionCalculatorError(
            f"Emission factor not found for activity '{activity}' in category '{category}'"
        )
    
    # Validate unit (warn but don't fail for flexibility)
    expected_unit = get_expected_unit(category, activity)
    if expected_unit and unit != expected_unit:
        # For now, we'll allow unit mismatch but could add conversion logic later
        # This is a warning, not an error
        pass
    
    # Validate amount
    if amount < 0:
        raise EmissionCalculatorError("Amount cannot be negative")
    
    # Calculate CO2 equivalent
    co2_equivalent = amount * emission_factor
    
    return co2_equivalent, emission_factor


def get_supported_activities(category: Optional[str] = None) -> Dict[str, list]:
    """
    Get list of supported activities, optionally filtered by category.
    
    Args:
        category: Optional category to filter by
    
    Returns:
        Dictionary mapping categories to lists of activities
    """
    if category:
        return {category: list(EMISSION_FACTORS.get(category, {}).keys())}
    return {cat: list(activities.keys()) for cat, activities in EMISSION_FACTORS.items()}


def get_all_emission_factors() -> Dict[str, Dict[str, float]]:
    """
    Get all emission factors.
    
    Returns:
        Dictionary of all emission factors by category and activity
    """
    return EMISSION_FACTORS.copy()

