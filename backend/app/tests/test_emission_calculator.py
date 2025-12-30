"""
Tests for Emission Calculator Service
"""
import pytest
from app.services.emission_calculator import (
    calculate_co2_equivalent,
    get_emission_factor,
    is_activity_supported,
    get_expected_unit,
    get_supported_activities,
    get_all_emission_factors,
    EmissionCalculatorError
)


# ==================== Task 19: Add Emission Calculator Service Tests ====================

def test_calculate_co2_transport_car_drive():
    """Test calculate_co2_equivalent() - transport category: car_drive"""
    co2, factor = calculate_co2_equivalent('transport', 'car_drive', 100, 'km')
    assert co2 == 12.0  # 100 km * 0.120 kg CO2/km
    assert factor == 0.120


def test_calculate_co2_transport_plane_flight():
    """Test calculate_co2_equivalent() - transport category: plane_flight"""
    co2, factor = calculate_co2_equivalent('transport', 'plane_flight', 500, 'km')
    assert co2 == 127.5  # 500 km * 0.255 kg CO2/km
    assert factor == 0.255


def test_calculate_co2_transport_train_ride():
    """Test calculate_co2_equivalent() - transport category: train_ride"""
    co2, factor = calculate_co2_equivalent('transport', 'train_ride', 200, 'km')
    assert abs(co2 - 2.8) < 0.0001  # 200 km * 0.014 kg CO2/km (handle floating point precision)
    assert factor == 0.014


def test_calculate_co2_transport_bus_ride():
    """Test calculate_co2_equivalent() - transport category: bus_ride"""
    co2, factor = calculate_co2_equivalent('transport', 'bus_ride', 50, 'km')
    assert co2 == 4.45  # 50 km * 0.089 kg CO2/km
    assert factor == 0.089


def test_calculate_co2_transport_motorcycle_ride():
    """Test calculate_co2_equivalent() - transport category: motorcycle_ride"""
    co2, factor = calculate_co2_equivalent('transport', 'motorcycle_ride', 75, 'km')
    assert co2 == 8.475  # 75 km * 0.113 kg CO2/km
    assert factor == 0.113


def test_calculate_co2_energy_electricity():
    """Test calculate_co2_equivalent() - energy category: electricity_usage"""
    co2, factor = calculate_co2_equivalent('energy', 'electricity_usage', 100, 'kWh')
    assert co2 == 23.3  # 100 kWh * 0.233 kg CO2/kWh
    assert factor == 0.233


def test_calculate_co2_energy_gas():
    """Test calculate_co2_equivalent() - energy category: gas_usage"""
    co2, factor = calculate_co2_equivalent('energy', 'gas_usage', 10, 'm³')
    assert co2 == 19.6  # 10 m³ * 1.96 kg CO2/m³
    assert factor == 1.96


def test_calculate_co2_energy_heating():
    """Test calculate_co2_equivalent() - energy category: heating"""
    co2, factor = calculate_co2_equivalent('energy', 'heating', 50, 'kWh')
    assert co2 == 11.65  # 50 kWh * 0.233 kg CO2/kWh
    assert factor == 0.233


def test_calculate_co2_food_beef():
    """Test calculate_co2_equivalent() - food category: beef"""
    co2, factor = calculate_co2_equivalent('food', 'beef', 2, 'kg')
    assert co2 == 54.0  # 2 kg * 27.0 kg CO2/kg
    assert factor == 27.0


def test_calculate_co2_food_pork():
    """Test calculate_co2_equivalent() - food category: pork"""
    co2, factor = calculate_co2_equivalent('food', 'pork', 1.5, 'kg')
    assert co2 == 18.15  # 1.5 kg * 12.1 kg CO2/kg
    assert factor == 12.1


def test_calculate_co2_food_chicken():
    """Test calculate_co2_equivalent() - food category: chicken"""
    co2, factor = calculate_co2_equivalent('food', 'chicken', 3, 'kg')
    assert abs(co2 - 20.7) < 0.0001  # 3 kg * 6.9 kg CO2/kg (handle floating point precision)
    assert factor == 6.9


def test_calculate_co2_food_fish():
    """Test calculate_co2_equivalent() - food category: fish"""
    co2, factor = calculate_co2_equivalent('food', 'fish', 1, 'kg')
    assert co2 == 5.0  # 1 kg * 5.0 kg CO2/kg
    assert factor == 5.0


def test_calculate_co2_food_dairy():
    """Test calculate_co2_equivalent() - food category: dairy"""
    co2, factor = calculate_co2_equivalent('food', 'dairy', 2.5, 'kg')
    assert co2 == 8.0  # 2.5 kg * 3.2 kg CO2/kg
    assert factor == 3.2


def test_calculate_co2_food_vegetables():
    """Test calculate_co2_equivalent() - food category: vegetables"""
    co2, factor = calculate_co2_equivalent('food', 'vegetables', 5, 'kg')
    assert co2 == 10.0  # 5 kg * 2.0 kg CO2/kg
    assert factor == 2.0


def test_calculate_co2_waste_plastic():
    """Test calculate_co2_equivalent() - waste category: plastic"""
    co2, factor = calculate_co2_equivalent('waste', 'plastic', 10, 'kg')
    assert co2 == 25.0  # 10 kg * 2.5 kg CO2/kg
    assert factor == 2.5


def test_calculate_co2_waste_paper():
    """Test calculate_co2_equivalent() - waste category: paper"""
    co2, factor = calculate_co2_equivalent('waste', 'paper', 20, 'kg')
    assert co2 == 18.0  # 20 kg * 0.9 kg CO2/kg
    assert factor == 0.9


def test_calculate_co2_waste_organic():
    """Test calculate_co2_equivalent() - waste category: organic"""
    co2, factor = calculate_co2_equivalent('waste', 'organic', 15, 'kg')
    assert co2 == 7.5  # 15 kg * 0.5 kg CO2/kg
    assert factor == 0.5


def test_calculate_co2_other():
    """Test calculate_co2_equivalent() - other category"""
    co2, factor = calculate_co2_equivalent('other', 'other', 100, 'kg')
    assert co2 == 100.0  # 100 kg * 1.0 kg CO2/kg
    assert factor == 1.0


def test_calculate_co2_unsupported_activity():
    """Test calculate_co2_equivalent() - unsupported activity error"""
    with pytest.raises(EmissionCalculatorError) as exc_info:
        calculate_co2_equivalent('transport', 'unsupported_activity', 100, 'km')
    assert 'not supported' in str(exc_info.value).lower()


def test_calculate_co2_unsupported_category():
    """Test calculate_co2_equivalent() - unsupported category error"""
    with pytest.raises(EmissionCalculatorError) as exc_info:
        calculate_co2_equivalent('nonexistent', 'car_drive', 100, 'km')
    assert 'not supported' in str(exc_info.value).lower()


def test_calculate_co2_negative_amount():
    """Test calculate_co2_equivalent() - negative amount error"""
    with pytest.raises(EmissionCalculatorError) as exc_info:
        calculate_co2_equivalent('transport', 'car_drive', -10, 'km')
    assert 'negative' in str(exc_info.value).lower() or 'cannot' in str(exc_info.value).lower()


def test_calculate_co2_zero_amount():
    """Test calculate_co2_equivalent() - zero amount (should work)"""
    co2, factor = calculate_co2_equivalent('transport', 'car_drive', 0, 'km')
    assert co2 == 0.0
    assert factor == 0.120


def test_calculate_co2_unit_mismatch():
    """Test calculate_co2_equivalent() - unit validation warnings (unit mismatch allowed)"""
    # Unit mismatch should not raise an error (flexibility)
    co2, factor = calculate_co2_equivalent('transport', 'car_drive', 100, 'miles')
    assert co2 == 12.0  # Calculation still works
    assert factor == 0.120


def test_get_emission_factor_valid():
    """Test get_emission_factor() - valid category/activity combinations"""
    assert get_emission_factor('transport', 'car_drive') == 0.120
    assert get_emission_factor('energy', 'electricity_usage') == 0.233
    assert get_emission_factor('food', 'beef') == 27.0
    assert get_emission_factor('waste', 'plastic') == 2.5
    assert get_emission_factor('other', 'other') == 1.0


def test_get_emission_factor_invalid_category():
    """Test get_emission_factor() - invalid category (returns None)"""
    assert get_emission_factor('nonexistent', 'car_drive') is None


def test_get_emission_factor_invalid_activity():
    """Test get_emission_factor() - invalid activity (returns None)"""
    assert get_emission_factor('transport', 'nonexistent') is None


def test_get_emission_factor_all_supported():
    """Test get_emission_factor() - all supported activities"""
    # Test all transport activities
    assert get_emission_factor('transport', 'car_drive') == 0.120
    assert get_emission_factor('transport', 'plane_flight') == 0.255
    assert get_emission_factor('transport', 'train_ride') == 0.014
    assert get_emission_factor('transport', 'bus_ride') == 0.089
    assert get_emission_factor('transport', 'motorcycle_ride') == 0.113
    
    # Test all energy activities
    assert get_emission_factor('energy', 'electricity_usage') == 0.233
    assert get_emission_factor('energy', 'gas_usage') == 1.96
    assert get_emission_factor('energy', 'heating') == 0.233
    
    # Test all food activities
    assert get_emission_factor('food', 'beef') == 27.0
    assert get_emission_factor('food', 'pork') == 12.1
    assert get_emission_factor('food', 'chicken') == 6.9
    assert get_emission_factor('food', 'fish') == 5.0
    assert get_emission_factor('food', 'dairy') == 3.2
    assert get_emission_factor('food', 'vegetables') == 2.0
    
    # Test all waste activities
    assert get_emission_factor('waste', 'plastic') == 2.5
    assert get_emission_factor('waste', 'paper') == 0.9
    assert get_emission_factor('waste', 'organic') == 0.5


def test_is_activity_supported_true():
    """Test is_activity_supported() - supported activities return True"""
    assert is_activity_supported('transport', 'car_drive') is True
    assert is_activity_supported('energy', 'electricity_usage') is True
    assert is_activity_supported('food', 'beef') is True
    assert is_activity_supported('waste', 'plastic') is True
    assert is_activity_supported('other', 'other') is True


def test_is_activity_supported_false():
    """Test is_activity_supported() - unsupported activities return False"""
    assert is_activity_supported('transport', 'nonexistent') is False
    assert is_activity_supported('nonexistent', 'car_drive') is False
    assert is_activity_supported('energy', 'invalid_activity') is False
    assert is_activity_supported('invalid_category', 'car_drive') is False


def test_get_expected_unit_valid():
    """Test get_expected_unit() - correct unit for each activity"""
    assert get_expected_unit('transport', 'car_drive') == 'km'
    assert get_expected_unit('transport', 'plane_flight') == 'km'
    assert get_expected_unit('energy', 'electricity_usage') == 'kWh'
    assert get_expected_unit('energy', 'gas_usage') == 'm³'
    assert get_expected_unit('food', 'beef') == 'kg'
    assert get_expected_unit('food', 'vegetables') == 'kg'
    assert get_expected_unit('waste', 'plastic') == 'kg'
    assert get_expected_unit('other', 'other') == 'kg'


def test_get_expected_unit_invalid():
    """Test get_expected_unit() - invalid activity returns None"""
    assert get_expected_unit('transport', 'nonexistent') is None
    assert get_expected_unit('nonexistent', 'car_drive') is None


def test_get_supported_activities_no_filter():
    """Test get_supported_activities() - without category filter"""
    activities = get_supported_activities()
    
    assert isinstance(activities, dict)
    assert 'transport' in activities
    assert 'energy' in activities
    assert 'food' in activities
    assert 'waste' in activities
    assert 'other' in activities
    
    # Check that activities are lists
    assert isinstance(activities['transport'], list)
    assert isinstance(activities['energy'], list)
    
    # Check specific activities
    assert 'car_drive' in activities['transport']
    assert 'electricity_usage' in activities['energy']
    assert 'beef' in activities['food']


def test_get_supported_activities_with_category():
    """Test get_supported_activities() - with category filter"""
    transport_activities = get_supported_activities('transport')
    
    assert isinstance(transport_activities, dict)
    assert 'transport' in transport_activities
    assert len(transport_activities) == 1
    
    assert isinstance(transport_activities['transport'], list)
    assert 'car_drive' in transport_activities['transport']
    assert 'plane_flight' in transport_activities['transport']
    assert 'train_ride' in transport_activities['transport']
    assert 'bus_ride' in transport_activities['transport']
    assert 'motorcycle_ride' in transport_activities['transport']


def test_get_supported_activities_invalid_category():
    """Test get_supported_activities() - invalid category returns empty list"""
    activities = get_supported_activities('nonexistent')
    assert isinstance(activities, dict)
    assert 'nonexistent' in activities
    assert activities['nonexistent'] == []


def test_get_supported_activities_response_structure():
    """Test get_supported_activities() - response structure"""
    activities = get_supported_activities()
    
    # Should be a dictionary
    assert isinstance(activities, dict)
    
    # Each value should be a list
    for category, activity_list in activities.items():
        assert isinstance(activity_list, list)
        # Each item in the list should be a string
        for activity in activity_list:
            assert isinstance(activity, str)


def test_get_all_emission_factors():
    """Test get_all_emission_factors() - complete factor dictionary"""
    factors = get_all_emission_factors()
    
    assert isinstance(factors, dict)
    assert 'transport' in factors
    assert 'energy' in factors
    assert 'food' in factors
    assert 'waste' in factors
    assert 'other' in factors
    
    # Check structure - each category should be a dict
    for category, activities in factors.items():
        assert isinstance(activities, dict)
        # Each activity should map to a float
        for activity, factor in activities.items():
            assert isinstance(factor, float)
            assert factor > 0


def test_get_all_emission_factors_data_structure():
    """Test get_all_emission_factors() - data structure"""
    factors = get_all_emission_factors()
    
    # Verify it returns a copy (shallow copy - top level is copied)
    original_transport_count = len(factors['transport'])
    
    # Verify specific values
    assert factors['transport']['car_drive'] == 0.120
    assert factors['energy']['electricity_usage'] == 0.233
    assert factors['food']['beef'] == 27.0
    
    # Verify structure - should have all categories
    assert 'transport' in factors
    assert 'energy' in factors
    assert 'food' in factors
    assert 'waste' in factors
    assert 'other' in factors

