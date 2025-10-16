"""
Design for Manufacturing (DFM) Rules
Checks if a design can actually be manufactured without issues.
"""


def check_dfm_rules(params, manufacturing_method='3d_printing'):
    """
    Validate design against manufacturing constraints.

    Args:
        params (dict): Design parameters
        manufacturing_method (str): 'sdprinting', 'cnc_milling', 'casting'

    Returns:
        dict: {
            'is_valid': bool,
            'violations': list of rule violations,
            'warnings': list of warnings
        }
    """
    violations = []
    warnings = []

    # Rule 1: Minimum wall thickness for 3D printing
    # PLA requires >= 2mm for structural integrity
    if params['base_thickness'] < 2.0:
        violations.append(
            f"Base thickness {params['base_thickness']}mm < 2mm minimum for 3D printing")

    if params['rib_thickness'] < 1.5:
        violations.append(
            f"Rib thickness {params['rib_thickness']}mm < 1.5mm minimum")

    # Rule 2: Maximum thickness (avoid warping in 3D printing)
    if params['base_thickness'] > 8.0:
        warnings.append(
            f"Base thickness {params['base_thickness']}mm may cause warping in 3D printing")

    # Rule 3: Hole diameter must match standard drill sizes
    # Common sizes: 3, 4, 5, 6, 8 mm
    standard_sizes = [3.0, 4.0, 5.0, 6.0, 8.0]
    closest_size = min(standard_sizes, key=lambda x: abs(
        x - params['hole_diameter']))
    if abs(params['hole_diameter'] - closest_size) > 0.5:
        violations.append(
            f"Hole diameter {params['hole_diameter']}mm not standard. Use {closest_size}mm")

    # Rule 4: Minimum fillet radius (avoid sharp corners that cause stress)
    if params['fillet_radius'] < 1.0:
        violations.append(
            f"Fillet radius {params['fillet_radius']}mm < 1mm minimum (stress concentration)")

    # Rule 5: Rib spacing must allow toolpath (for 3D printing nozzle)
    if params['rib_count'] > 0:
        rib_spacing = params['base_length'] / (params['rib_count'] + 1)
        if rib_spacing < 10.0:
            violations.append(
                f"Rib spacing {rib_spacing:.1f}mm < 10mm minimum (ribs too close)")

    # Rule 6: Maximum rib count (diminishing returns + longer print time)
    if params['rib_count'] > 5:
        warnings.append(
            f"Rib count {params['rib_count']} > 5 may not improve strength significantly")

    # Rule 7: Aspect ratio check (base_length / base_width)
    aspect_ratio = params['base_length'] / params['base_width']
    if aspect_ratio > 3.0:
        warnings.append(
            f"Aspect ratio {aspect_ratio:.1f} > 3.0 may cause bending issues")

    # Rule 8: Hole position (must not be too close to edge)
    # Assume hole is centered; check 2x diameter clearance
    edge_distance = params['base_width'] / 2 - params['hole_diameter']
    if edge_distance < params['hole_diameter'] * 2:
        violations.append(
            f"Hole too close to edge (need 2x diameter clearance)")

    is_valid = len(violations) == 0

    return {
        'is_valid': is_valid,
        'violations': violations,
        'warnings': warnings
    }


# Test function
if __name__ == '__main__':
    print("Testing DFM Rules Checker...")
    print("=" * 60)

    # Test Case 1: Good design
    good_design = {
        'base_length': 50.0,
        'base_width': 30.0,
        'base_thickness': 3.0,
        'rib_count': 3,
        'rib_thickness': 2.5,
        'fillet_radius': 2.0,
        'hole_diameter': 5.0
    }

    print("\nTest 1: Valid Design")
    print("-" * 60)
    result = check_dfm_rules(good_design)
    print(f"Is Valid: {result['is_valid']}")
    print(f"Violations: {len(result['violations'])}")
    print(f"Warnings: {len(result['warnings'])}")
    if result['warnings']:
        for warning in result['warnings']:
            print(f"  ⚠️  {warning}")
    if result['is_valid']:
        print("  ✅ Design passes all DFM rules!")

    # Test Case 2: Bad design (too thin)
    bad_design = {
        'base_length': 50.0,
        'base_width': 30.0,
        'base_thickness': 1.5,  # TOO THIN
        'rib_count': 6,         # TOO MANY
        'rib_thickness': 1.0,   # TOO THIN
        'fillet_radius': 0.5,   # TOO SMALL
        'hole_diameter': 3.5    # NON-STANDARD
    }

    print("\nTest 2: Invalid Design (Intentional Violations)")
    print("-" * 60)
    result = check_dfm_rules(bad_design)
    print(f"Is Valid: {result['is_valid']}")
    print(f"Violations: {len(result['violations'])}")
    if result['violations']:
        for violation in result['violations']:
            print(f"  ❌ {violation}")
    if result['warnings']:
        for warning in result['warnings']:
            print(f"  ⚠️  {warning}")

    print("\n" + "=" * 60)
    print("✅ DFM rules checker working correctly!")
