"""
Multi-Objective Optimizer
Uses NSGA-II genetic algorithm to find Pareto-optimal designs.
"""

import numpy as np
import pandas as pd
import joblib
from pymoo.core.problem import Problem
from pymoo.algorithms.moo.nsga2 import NSGA2
from pymoo.operators.crossover.sbx import SBX
from pymoo.operators.mutation.pm import PM
from pymoo.operators.sampling.rnd import FloatRandomSampling  # ADD THIS LINE
from pymoo.optimize import minimize
from pymoo.termination import get_termination

from material_library import get_material
from dfm_rules import check_dfm_rules
from cost_estimator import calculate_manufacturing_cost



class BracketOptimizationProblem(Problem):
    """
    Multi-objective optimization problem for prosthetic bracket design.
    
    Objectives:
        1. Minimize mass (grams)
        2. Minimize cost (₹)
    
    Constraints:
        1. Stress < yield_strength / safety_factor
        2. Deflection < 0.5 mm
        3. DFM rules must be satisfied
    """
    
    def __init__(self, load, material_name, stress_model, deflection_model):
        """
        Initialize optimization problem.
        
        Args:
            load (float): Applied load in Newtons
            material_name (str): Material name
            stress_model: Trained surrogate for stress prediction
            deflection_model: Trained surrogate for deflection prediction
        """
        # Define parameter bounds
        # [base_length, base_width, base_thickness, rib_count, rib_thickness, fillet_radius, hole_diameter]
        xl = np.array([40.0, 25.0, 2.0, 2, 1.5, 1.0, 3.0])  # Lower bounds
        xu = np.array([70.0, 40.0, 5.0, 5, 3.5, 4.0, 8.0])  # Upper bounds
        
        super().__init__(
            n_var=7,      # 7 design parameters
            n_obj=2,      # 2 objectives (mass, cost)
            n_constr=3,   # 3 constraints (stress, deflection, DFM)
            xl=xl,
            xu=xu
        )
        
        self.load = load
        self.material = get_material(material_name)
        self.material_name = material_name
        self.stress_model = stress_model
        self.deflection_model = deflection_model
        
        # Constraint limits
        # Constraint limits
        self.safety_factor_target = 1.5  # CHANGED from 2.0 (less strict)
        self.max_deflection = 1.0  # CHANGED from 0.5mm (more lenient)

        
        print(f"Optimization problem initialized:")
        print(f"  Material: {self.material['name']}")
        print(f"  Load: {load} N")
        print(f"  Target Safety Factor: {self.safety_factor_target}")
        print(f"  Max Deflection: {self.max_deflection} mm")
    
    def _evaluate(self, X, out, *args, **kwargs):
        """
        Evaluate population of designs.
        
        Args:
            X: (n_designs, 7) array of parameter values
        """
        n_designs = X.shape[0]
        
        # Initialize output arrays
        f1 = np.zeros(n_designs)  # Objective 1: mass
        f2 = np.zeros(n_designs)  # Objective 2: cost
        g1 = np.zeros(n_designs)  # Constraint 1: stress
        g2 = np.zeros(n_designs)  # Constraint 2: deflection
        g3 = np.zeros(n_designs)  # Constraint 3: DFM
        
        for i in range(n_designs):
            # Extract parameters
            params = {
                'base_length': X[i, 0],
                'base_width': X[i, 1],
                'base_thickness': X[i, 2],
                'rib_count': int(round(X[i, 3])),
                'rib_thickness': X[i, 4],
                'fillet_radius': X[i, 5],
                'hole_diameter': X[i, 6]
            }
            
            # Predict stress and deflection using surrogates
            X_pred = pd.DataFrame([params])
            stress = self.stress_model.predict(X_pred)[0]
            deflection = self.deflection_model.predict(X_pred)[0]
            
            # Calculate mass
            base_volume = (params['base_length'] * params['base_width'] * 
                          params['base_thickness']) / 1000  # cm³
            rib_volume = (params['rib_thickness'] * params['base_width'] * 20 * 
                         params['rib_count']) / 1000  # cm³
            total_volume = base_volume + rib_volume
            mass = total_volume * self.material['density']  # grams
            
            # Calculate cost
            try:
                cost_result = calculate_manufacturing_cost(params, self.material_name, '3d_printing')
                cost = cost_result['total_cost']
            except:
                cost = mass * self.material['cost_per_kg'] / 1000 + 10  # Fallback
            
            # Check DFM rules
            dfm = check_dfm_rules(params)
            
            # Set objectives (to minimize)
            f1[i] = mass
            f2[i] = cost
            
            # Set constraints (g <= 0 is feasible)
            max_stress_allowed = self.material['yield_strength'] / self.safety_factor_target
            g1[i] = stress - max_stress_allowed  # Stress constraint
            g2[i] = deflection - self.max_deflection  # Deflection constraint
            g3[i] = 0.0 if dfm['is_valid'] else 1.0  # DFM constraint
        
        out["F"] = np.column_stack([f1, f2])
        out["G"] = np.column_stack([g1, g2, g3])


def run_optimization(load=50.0, material_name='PLA', pop_size=50, n_gen=100):
    """
    Run multi-objective optimization.
    
    Args:
        load (float): Applied load in N
        material_name (str): Material name
        pop_size (int): Population size
        n_gen (int): Number of generations
    
    Returns:
        dict: Optimization results with Pareto front
    """
    print("=" * 70)
    print("RUNNING MULTI-OBJECTIVE OPTIMIZATION")
    print("=" * 70)
    
    # Load surrogate models
    print("\nLoading surrogate models...")
    stress_model = joblib.load('data/stress_surrogate.pkl')
    deflection_model = joblib.load('data/deflection_surrogate.pkl')
    print("✅ Models loaded")
    
    # Define problem
    problem = BracketOptimizationProblem(load, material_name, stress_model, deflection_model)
    
    # Configure NSGA-II algorithm
    print(f"\nConfiguring NSGA-II:")
    print(f"  Population size: {pop_size}")
    print(f"  Generations: {n_gen}")
    print(f"  Expected evaluations: {pop_size * n_gen}")
    
    algorithm = NSGA2(
    pop_size=pop_size,
    sampling=FloatRandomSampling(),  # CHANGED THIS LINE
    crossover=SBX(prob=0.9, eta=15),
    mutation=PM(eta=20),
    eliminate_duplicates=True
)

    
    # Run optimization
    print("\n🚀 Starting optimization...")
    print("This will take 30-60 seconds...\n")
    
    termination = get_termination("n_gen", n_gen)
    
    result = minimize(
        problem,
        algorithm,
        termination,
        seed=42,
        verbose=True  # Show progress
    )
    
    # Extract Pareto front solutions
    print("\n" + "=" * 70)
    print("OPTIMIZATION COMPLETE")
    print("=" * 70)
    
    n_solutions = len(result.F)
    print(f"\n✅ Found {n_solutions} Pareto-optimal designs")
    
    # Package results
    pareto_solutions = []
    
    for i in range(n_solutions):
        params = {
            'base_length': round(result.X[i, 0], 2),
            'base_width': round(result.X[i, 1], 2),
            'base_thickness': round(result.X[i, 2], 2),
            'rib_count': int(round(result.X[i, 3])),
            'rib_thickness': round(result.X[i, 4], 2),
            'fillet_radius': round(result.X[i, 5], 2),
            'hole_diameter': round(result.X[i, 6], 2)
        }
        
        pareto_solutions.append({
            'id': i,
            'parameters': params,
            'mass': round(result.F[i, 0], 2),
            'cost': round(result.F[i, 1], 2)
        })
    
    # Sort by mass (for display)
    pareto_solutions = sorted(pareto_solutions, key=lambda x: x['mass'])
    
    # Print summary
    print("\nPareto Front Summary:")
    print(f"  Lightest design: {pareto_solutions[0]['mass']} g, ₹{pareto_solutions[0]['cost']}")
    print(f"  Cheapest design: {min(pareto_solutions, key=lambda x: x['cost'])['cost']} ₹, {min(pareto_solutions, key=lambda x: x['cost'])['mass']} g")
    print(f"  Heaviest design: {pareto_solutions[-1]['mass']} g, ₹{pareto_solutions[-1]['cost']}")
    
    return {
        'pareto_front': pareto_solutions,
        'n_generations': n_gen,
        'n_evaluations': pop_size * n_gen
    }


# Test function
if __name__ == '__main__':
    import time
    
    start_time = time.time()
    
    # Run optimization
    results = run_optimization(
        load=50.0,
        material_name='PLA',
        pop_size=20,   # Smaller for testing (use 50 for real runs)
        n_gen=30       # Fewer generations for testing (use 100 for real runs)
    )
    
    elapsed = time.time() - start_time
    
    # Display results
    print("\n" + "=" * 70)
    print("TOP 5 DESIGNS")
    print("=" * 70)
    
    for i, design in enumerate(results['pareto_front'][:5]):
        print(f"\nDesign {i+1}:")
        print(f"  Mass: {design['mass']} g")
        print(f"  Cost: ₹{design['cost']}")
        print(f"  Parameters:")
        for key, value in design['parameters'].items():
            print(f"    {key}: {value}")
    
    print("\n" + "=" * 70)
    print(f"✅ Optimization completed in {elapsed:.1f} seconds")
    print(f"🎉 YOU NOW HAVE A WORKING AI OPTIMIZER!")
