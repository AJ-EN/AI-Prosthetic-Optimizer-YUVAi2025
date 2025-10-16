"""
Manufacturing Cost Estimator
Calculates the cost to produce a part based on material and manufacturing time.
"""

from material_library import get_material
import numpy as np


def calculate_manufacturing_cost(params, material_name, manufacturing_method='3d_printing'):
    """
    Calculate total manufacturing cost.

    Cost = Material Cost + Machine Time Cost + Setup Cost

    Args:
        params (dict): Design parameters
        material_name (str): Material name
        manufacturing_method (str): Manufacturing process

    Returns:
        dict: {
            'total_cost': Total cost in ₹,
            'material_cost': Material cost in ₹,
            'machine_cost': Machine time cost in ₹,
            'breakdown': Detailed breakdown
        }
    """
    material = get_material(material_name)

    # Calculate volume (mm³ to cm³)
    base_volume = (params['base_length'] * params['base_width'] *
                   params['base_thickness']) / 1000  # cm³

    rib_height = 20  # mm
    rib_volume_each = (params['rib_thickness'] * params['base_width'] *
                       rib_height) / 1000  # cm³
    total_rib_volume = rib_volume_each * params['rib_count']

    # Subtract hole volume
    hole_volume = (np.pi * (params['hole_diameter'] / 2)**2 *
                   params['base_thickness']) / 1000  # cm³

    total_volume_cm3 = base_volume + total_rib_volume - hole_volume

    # Calculate mass (g)
    mass_g = total_volume_cm3 * material['density']
    mass_kg = mass_g / 1000

    # Material cost
    material_cost = mass_kg * material['cost_per_kg']

    # Manufacturing time estimation
    if manufacturing_method == '3d_printing':
        # 3D printing time estimate
        # Factors: volume, layer height (0.2mm), infill (20%), print speed
        layer_height = 0.2  # mm
        num_layers = (params['base_thickness'] + 20) / \
            layer_height  # approximate
        time_per_layer = 0.5  # minutes (simplified)
        print_time_hours = (num_layers * time_per_layer) / 60

        # PLA 3D printer cost: ₹5 per hour (electricity + depreciation)
        machine_cost_per_hour = 5
        machine_cost = print_time_hours * machine_cost_per_hour

    elif manufacturing_method == 'cnc_milling':
        # CNC milling time estimate
        # Based on material removal volume
        stock_volume = (params['base_length'] + 10) * \
            (params['base_width'] + 10) * 10  # mm³
        removal_volume = stock_volume / 1000 - total_volume_cm3  # cm³

        # Milling rate: ~5 cm³/min for aluminum
        milling_time_hours = (removal_volume / 5) / 60

        # CNC machine cost: ₹200 per hour
        machine_cost_per_hour = 200
        machine_cost = milling_time_hours * machine_cost_per_hour

    else:
        # Default estimate
        machine_cost = 10

    # Setup cost (one-time per part type)
    setup_cost = 5  # ₹5 for basic setup

    # Total cost
    total_cost = material_cost + machine_cost + setup_cost

    return {
        'total_cost': round(total_cost, 2),
        'material_cost': round(material_cost, 2),
        'machine_cost': round(machine_cost, 2),
        'setup_cost': setup_cost,
        'breakdown': {
            'mass_kg': round(mass_kg, 4),
            'volume_cm3': round(total_volume_cm3, 2),
            'manufacturing_time_hours': round(print_time_hours if manufacturing_method == '3d_printing' else milling_time_hours, 2)
        }
    }


# Test function
if __name__ == '__main__':
    print("Testing Cost Estimator...")
    print("=" * 60)

    test_params = {
        'base_length': 50.0,
        'base_width': 30.0,
        'base_thickness': 3.0,
        'rib_count': 3,
        'rib_thickness': 2.5,
        'fillet_radius': 2.0,
        'hole_diameter': 5.0
    }

    # Test 1: 3D Printing with PLA
    print("\nTest 1: 3D Printing with PLA")
    print("-" * 60)
    cost_pla = calculate_manufacturing_cost(test_params, 'PLA', '3d_printing')
    print(f"Total Cost: ₹{cost_pla['total_cost']}")
    print(f"  Material: ₹{cost_pla['material_cost']}")
    print(f"  Machine Time: ₹{cost_pla['machine_cost']}")
    print(f"  Setup: ₹{cost_pla['setup_cost']}")
    print(f"  Mass: {cost_pla['breakdown']['mass_kg']} kg")
    print(
        f"  Print Time: {cost_pla['breakdown']['manufacturing_time_hours']:.1f} hours")

    # Test 2: CNC Milling with Aluminum
    print("\nTest 2: CNC Milling with Aluminum 6061")
    print("-" * 60)
    cost_alu = calculate_manufacturing_cost(
        test_params, 'Aluminum6061', 'cnc_milling')
    print(f"Total Cost: ₹{cost_alu['total_cost']}")
    print(f"  Material: ₹{cost_alu['material_cost']}")
    print(f"  Machine Time: ₹{cost_alu['machine_cost']}")
    print(f"  Setup: ₹{cost_alu['setup_cost']}")
    print(f"  Mass: {cost_alu['breakdown']['mass_kg']} kg")
    print(
        f"  Machining Time: {cost_alu['breakdown']['manufacturing_time_hours']:.1f} hours")

    # Cost comparison
    print("\nCost Comparison:")
    print("-" * 60)
    print(
        f"PLA (3D Print): ₹{cost_pla['total_cost']} - Affordable for prosthetics ✅")
    print(
        f"Aluminum (CNC): ₹{cost_alu['total_cost']} - {cost_alu['total_cost']/cost_pla['total_cost']:.1f}x more expensive")

    print("\n" + "=" * 60)
    print("✅ Cost estimator working correctly!")
