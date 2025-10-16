import json
import os

# Path to materials database
MATERIALS_FILE = os.path.join(
    os.path.dirname(__file__), 'data', 'materials.json')


def load_materials():
    """
    Load all materials from database.

    Returns:
        dict: Dictionary of material properties
    """
    with open(MATERIALS_FILE, 'r') as f:
        materials = json.load(f)
    return materials


def get_material(material_name):
    """
    Get properties for a specific material.

    Args:
        material_name (str): Name of material (e.g., 'PLA', 'Aluminum6061')

    Returns:
        dict: Material properties

    Raises:
        ValueError: If material not found
    """
    materials = load_materials()

    if material_name not in materials:
        available = ', '.join(materials.keys())
        raise ValueError(
            f"Material '{material_name}' not found. Available: {available}")

    return materials[material_name]


# Test function
if __name__ == '__main__':
    # This runs when you execute: python backend/material_library.py
    print("Testing Material Library...")
    print("-" * 50)

    materials = load_materials()
    print(f"Loaded {len(materials)} materials:")
    for name in materials.keys():
        print(f"  - {name}")

    print("\nTesting PLA material:")
    pla = get_material('PLA')
    print(f"  Young's Modulus: {pla['youngs_modulus']} GPa")
    print(f"  Density: {pla['density']} g/cm³")
    print(f"  Yield Strength: {pla['yield_strength']} MPa")
    print(f"  Cost: ₹{pla['cost_per_kg']} per kg")

    print("\n✅ Material library working correctly!")
