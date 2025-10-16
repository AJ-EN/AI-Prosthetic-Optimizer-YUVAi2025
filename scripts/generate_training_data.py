"""
Training Data Generator
Creates 500 design variations using Latin Hypercube Sampling.
Evaluates each with beam theory physics (fast).
Outputs training dataset for surrogate model.
"""

import os
import sys
import numpy as np
import pandas as pd
from scipy.stats import qmc

# Add backend directory to path BEFORE importing from backend modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

# Now import from backend modules
from physics_calculator import calculate_stress_and_deflection, calculate_mass
from dfm_rules import check_dfm_rules
from cost_estimator import calculate_manufacturing_cost


def generate_parameter_samples(n_samples=500):
    """
    Generate design parameter samples using Latin Hypercube Sampling.
    LHS ensures good coverage of the parameter space.

    Args:
        n_samples (int): Number of samples to generate

    Returns:
        list of dict: List of parameter dictionaries
    """
    print(
        f"Generating {n_samples} parameter samples using Latin Hypercube Sampling...")

    # Define parameter bounds (min, max)
    bounds = {
        'base_length': (40.0, 70.0),      # mm
        'base_width': (25.0, 40.0),       # mm
        'base_thickness': (2.0, 5.0),     # mm
        'rib_count': (2, 5),              # discrete integer
        'rib_thickness': (1.5, 3.5),      # mm
        'fillet_radius': (1.0, 4.0),      # mm
        'hole_diameter': (3.0, 8.0)       # mm
    }

    # Create Latin Hypercube sampler
    n_dims = len(bounds)
    # Fixed seed for reproducibility
    sampler = qmc.LatinHypercube(d=n_dims, seed=42)
    samples_unit = sampler.random(n=n_samples)  # Get samples in [0, 1]

    # Scale samples to actual parameter ranges
    parameter_samples = []
    param_names = list(bounds.keys())

    for sample in samples_unit:
        params = {}
        for i, param_name in enumerate(param_names):
            low, high = bounds[param_name]
            value = low + sample[i] * (high - low)

            # Round discrete parameters
            if param_name == 'rib_count':
                value = int(round(value))
            # Round hole diameter to nearest 0.5mm
            elif param_name == 'hole_diameter':
                value = round(value * 2) / 2
            else:
                value = round(value, 2)

            params[param_name] = value

        parameter_samples.append(params)

    print(f"✅ Generated {len(parameter_samples)} parameter sets")
    return parameter_samples


def evaluate_design(params, load=50.0, material='PLA'):
    """
    Evaluate a single design using fast physics calculator.

    Args:
        params (dict): Design parameters
        load (float): Applied load in N
        material (str): Material name

    Returns:
        dict: Evaluation results
    """
    try:
        # Calculate physics
        physics = calculate_stress_and_deflection(params, load, material)
        mass = calculate_mass(params, material)

        # Check DFM rules
        dfm = check_dfm_rules(params)

        # Calculate cost
        cost = calculate_manufacturing_cost(params, material, '3d_printing')

        # Combine results
        result = {
            **params,  # Include all parameters
            'max_stress': physics['max_stress'],
            'max_deflection': physics['max_deflection'],
            'safety_factor': physics['safety_factor'],
            'mass': mass,
            'total_cost': cost['total_cost'],
            'dfm_valid': dfm['is_valid'],
            'dfm_violations': len(dfm['violations'])
        }

        return result

    except Exception as e:
        print(f"  ⚠️  Error evaluating design: {e}")
        return None


def generate_training_dataset(n_samples=500, output_file='training_data.csv'):
    """
    Generate complete training dataset.

    Args:
        n_samples (int): Number of samples
        output_file (str): Output CSV filename
    """
    print("=" * 70)
    print("TRAINING DATA GENERATION")
    print("=" * 70)

    # Generate parameter samples
    parameter_samples = generate_parameter_samples(n_samples)

    # Evaluate all designs
    print(f"\nEvaluating {n_samples} designs...")
    print("This will take about 30-60 seconds...")

    results = []
    valid_count = 0

    for i, params in enumerate(parameter_samples):
        if (i + 1) % 50 == 0:
            print(
                f"  Progress: {i + 1}/{n_samples} ({(i+1)/n_samples*100:.1f}%)")

        result = evaluate_design(params, load=50.0, material='PLA')

        if result is not None:
            results.append(result)
            if result['dfm_valid']:
                valid_count += 1

    # Convert to DataFrame
    df = pd.DataFrame(results)

    # Save to CSV
    output_path = os.path.join('../backend/data', output_file)
    df.to_csv(output_path, index=False)

    # Print statistics
    print("\n" + "=" * 70)
    print("DATASET STATISTICS")
    print("=" * 70)
    print(f"Total designs generated: {len(df)}")
    print(f"DFM-valid designs: {valid_count} ({valid_count/len(df)*100:.1f}%)")
    print(
        f"DFM-invalid designs: {len(df) - valid_count} ({(len(df)-valid_count)/len(df)*100:.1f}%)")

    print("\nParameter Ranges:")
    for col in ['base_length', 'base_width', 'base_thickness', 'rib_count']:
        print(f"  {col}: {df[col].min():.1f} - {df[col].max():.1f}")

    print("\nPerformance Ranges:")
    print(
        f"  Stress: {df['max_stress'].min():.1f} - {df['max_stress'].max():.1f} MPa")
    print(
        f"  Deflection: {df['max_deflection'].min():.3f} - {df['max_deflection'].max():.3f} mm")
    print(
        f"  Safety Factor: {df['safety_factor'].min():.2f} - {df['safety_factor'].max():.2f}")
    print(f"  Mass: {df['mass'].min():.1f} - {df['mass'].max():.1f} g")
    print(
        f"  Cost: ₹{df['total_cost'].min():.2f} - ₹{df['total_cost'].max():.2f}")

    print(f"\n✅ Dataset saved to: {output_path}")
    print("=" * 70)

    return df


if __name__ == '__main__':
    # Generate 500 training samples
    df = generate_training_dataset(
        n_samples=500, output_file='training_data.csv')

    print("\n🚀 Training data generation complete!")
    print("Next step: Train surrogate model using this data")
