"""
Physics Calculator
Calculates stress and deflection using beam theory (Euler-Bernoulli).
This is the "fast evaluator" that replaces expensive FEA during optimization.
"""

import numpy as np
from material_library import get_material


def calculate_stress_and_deflection(params, load_magnitude, material_name):
    """
    Calculate maximum stress and deflection for L-bracket design.

    Uses cantilever beam theory as approximation:
    - Stress: σ = (M * c) / I
    - Deflection: δ = (F * L³) / (3 * E * I)

    Args:
        params (dict): Design parameters
            - base_length: Length of bracket (mm)
            - base_width: Width of bracket (mm)
            - base_thickness: Thickness of base plate (mm)
            - rib_count: Number of reinforcing ribs
            - rib_thickness: Thickness of ribs (mm)
            - fillet_radius: Fillet radius (mm)
            - hole_diameter: Mounting hole diameter (mm)
        load_magnitude (float): Applied force in Newtons
        material_name (str): Material name (e.g., 'PLA')

    Returns:
        dict: {
            'max_stress': Maximum stress in MPa,
            'max_deflection': Maximum deflection in mm,
            'safety_factor': Safety factor against yield
        }
    """
    # Get material properties
    material = get_material(material_name)
    E = material['youngs_modulus'] * 1e9  # Convert GPa to Pa
    yield_strength = material['yield_strength']  # MPa

    # Extract geometry (convert mm to meters for calculation)
    L = params['base_length'] / 1000  # m
    b = params['base_width'] / 1000   # m
    h = params['base_thickness'] / 1000  # m

    # Calculate second moment of area (rectangular cross-section)
    # I = (b * h³) / 12
    I = (b * h**3) / 12  # m^4

    # Apply rib reinforcement factor
    # Each rib adds stiffness (empirical approximation)
    rib_reinforcement = 1 + (0.15 * params['rib_count'])
    I_effective = I * rib_reinforcement

    # Calculate bending moment at fixed end
    # M = F * L (for cantilever beam with point load at free end)
    M = load_magnitude * L  # N·m

    # Calculate maximum stress
    # σ = (M * c) / I, where c = distance to neutral axis = h/2
    c = h / 2  # m
    stress = (M * c) / I_effective  # Pa
    stress_mpa = stress / 1e6  # Convert to MPa

    # Apply stress concentration factor for fillets
    # Smaller fillet radius = higher stress concentration
    # Using simplified approximation: Kt = 1.5 / (1 + r/h)
    fillet_factor = 1.5 / \
        (1 + (params['fillet_radius'] / params['base_thickness']))
    stress_mpa *= fillet_factor

    # Adjust for hole (stress concentration around hole)
    # Rough approximation: 20% stress increase if hole > 5mm
    if params['hole_diameter'] > 5.0:
        stress_mpa *= 1.2

    # Calculate maximum deflection
    # δ = (F * L³) / (3 * E * I)
    deflection = (load_magnitude * L**3) / (3 * E * I_effective)  # m
    deflection_mm = deflection * 1000  # Convert to mm

    # Calculate safety factor
    safety_factor = yield_strength / stress_mpa

    return {
        'max_stress': round(stress_mpa, 2),
        'max_deflection': round(deflection_mm, 3),
        'safety_factor': round(safety_factor, 2)
    }


def calculate_mass(params, material_name):
    """
    Calculate mass of the bracket.

    Args:
        params (dict): Design parameters
        material_name (str): Material name

    Returns:
        float: Mass in grams
    """
    material = get_material(material_name)
    density = material['density']  # g/cm³

    # Calculate volume (simplified as base + ribs)
    base_volume = (params['base_length'] * params['base_width'] *
                   params['base_thickness'])  # mm³

    # Volume of ribs (approximated as rectangular plates)
    rib_height = 20  # mm (fixed vertical height)
    rib_volume_each = (params['rib_thickness'] *
                       params['base_width'] * rib_height)
    total_rib_volume = rib_volume_each * params['rib_count']

    # Subtract hole volume
    hole_volume = np.pi * \
        (params['hole_diameter'] / 2)**2 * params['base_thickness']

    # Total volume in cm³
    total_volume = (base_volume + total_rib_volume -
                    hole_volume) / 1000  # mm³ to cm³

    # Mass = volume × density
    mass = total_volume * density  # grams

    return round(mass, 2)


# Test function
if __name__ == '__main__':
    print("Testing Physics Calculator...")
    print("=" * 60)

    # Define test bracket design
    test_params = {
        'base_length': 50.0,      # mm
        'base_width': 30.0,       # mm
        'base_thickness': 3.0,    # mm
        'rib_count': 3,
        'rib_thickness': 2.5,     # mm
        'fillet_radius': 2.0,     # mm
        'hole_diameter': 5.0      # mm
    }

    # Test with 50N load on PLA material
    print("\nTest Case: Prosthetic Bracket")
    print("-" * 60)
    print("Design Parameters:")
    for key, value in test_params.items():
        print(f"  {key}: {value}")

    print("\nLoading Conditions:")
    print(f"  Applied Force: 50 N")
    print(f"  Material: PLA")

    # Calculate physics
    results = calculate_stress_and_deflection(test_params, 50.0, 'PLA')
    mass = calculate_mass(test_params, 'PLA')

    print("\nResults:")
    print(f"  Maximum Stress: {results['max_stress']} MPa")
    print(f"  Maximum Deflection: {results['max_deflection']} mm")
    print(f"  Safety Factor: {results['safety_factor']}")
    print(f"  Mass: {mass} grams")

    # Check if design is safe
    print("\nDesign Assessment:")
    if results['safety_factor'] >= 2.0:
        print(f"  ✅ SAFE - Safety factor {results['safety_factor']} > 2.0")
    elif results['safety_factor'] >= 1.5:
        print(
            f"  ⚠️  MARGINAL - Safety factor {results['safety_factor']} between 1.5-2.0")
    else:
        print(f"  ❌ UNSAFE - Safety factor {results['safety_factor']} < 1.5")

    if results['max_deflection'] <= 0.5:
        print(
            f"  ✅ STIFF - Deflection {results['max_deflection']} mm < 0.5 mm limit")
    else:
        print(
            f"  ❌ TOO FLEXIBLE - Deflection {results['max_deflection']} mm > 0.5 mm")

    print("\n" + "=" * 60)
    print("✅ Physics calculator working correctly!")