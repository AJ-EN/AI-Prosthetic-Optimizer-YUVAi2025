"""
Flask API Server
Serves optimization results and STL files to frontend.
"""

from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import os
import json
import sys
import zipfile
import hashlib
import time
from pathlib import Path
from io import BytesIO

# Import your modules
from optimizer import run_optimization
from geometry_generator import generate_bracket_stl
from material_library import load_materials
from material_advisor import get_material_advisor

app = Flask(__name__)
CORS(app)  # Allow frontend to access API

# Configuration
app.config['MODELS_FOLDER'] = 'data/models'

# Ensure required directories exist
Path(app.config['MODELS_FOLDER']).mkdir(parents=True, exist_ok=True)

# Cache for storing optimization results in memory (for download endpoint)
optimization_cache = {}

# Disk cache directory for optimization runs
CACHE_DIR = Path('data/cache')
CACHE_DIR.mkdir(parents=True, exist_ok=True)


def _compute_request_hash(load, material, pop_size, n_gen):
    """Create stable hash for optimization inputs."""
    payload = {
        'load': round(load, 4),
        'material': material,
        'pop_size': pop_size,
        'n_gen': n_gen
    }
    hash_input = json.dumps(payload, sort_keys=True).encode('utf-8')
    return hashlib.sha1(hash_input).hexdigest()


def _load_cached_results(cache_path):
    """Load cached optimization results from disk if available."""
    try:
        with open(cache_path, 'r') as f:
            cached_payload = json.load(f)
        return cached_payload.get('results') or cached_payload
    except Exception as exc:
        print(f"[API] Warning: failed to load cache {cache_path}: {exc}")
        return None


def _ensure_design_assets(results):
    """Make sure STL files exist and refresh in-memory cache."""
    if not results:
        return

    for design in results.get('pareto_front', []):
        design_id = str(design.get('id'))
        params = design.get('parameters')
        stl_file = design.get('stl_file')

        if params:
            stl_path = None
            if stl_file:
                stl_path = Path(app.config['MODELS_FOLDER']) / stl_file

            if not stl_path or not stl_path.exists():
                try:
                    regenerated = generate_bracket_stl(
                        params=params,
                        output_dir=app.config['MODELS_FOLDER']
                    )
                    design['stl_file'] = os.path.basename(regenerated)
                except Exception as regen_exc:
                    print(
                        f"[API] Warning: STL regeneration failed for design {design_id}: {regen_exc}")
                    design['stl_file'] = None

        # Refresh in-memory cache for download endpoint
        optimization_cache[design_id] = design


def get_design_by_id(design_id):
    """
    Retrieve a design from the optimization cache.

    Args:
        design_id (str): Design ID to retrieve

    Returns:
        dict: Design data or None if not found
    """
    # Check cache
    if design_id in optimization_cache:
        return optimization_cache[design_id]

    # Check demo results file
    results_file = 'data/demo_results.json'
    if os.path.exists(results_file):
        with open(results_file, 'r') as f:
            results = json.load(f)
            for design in results.get('pareto_front', []):
                if str(design['id']) == design_id:
                    return design

    return None


@app.route('/')
def index():
    """Health check endpoint."""
    return jsonify({
        'status': 'online',
        'message': 'AI Prosthetic Optimizer API v1.0',
        'endpoints': ['/api/materials', '/api/optimize', '/models/<filename>']
    })


@app.route('/api/materials', methods=['GET'])
def get_materials():
    """Get list of available materials."""
    try:
        materials = load_materials()
        return jsonify({
            'success': True,
            'materials': materials
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/optimize', methods=['POST'])
def optimize():
    """
    Run optimization and return Pareto front.

    Request body:
    {
        "load": 50.0,
        "material": "PLA",
        "pop_size": 40,
        "n_gen": 50
    }
    """
    try:
        data = request.get_json()

        # Validate inputs
        load = float(data.get('load', 50.0))
        material = data.get('material', 'PLA')
        pop_size = int(data.get('pop_size', 40))
        n_gen = int(data.get('n_gen', 50))

        print(
            f"[API] Optimization request: {load}N, {material}, pop={pop_size}, gen={n_gen}")

        # Check disk cache first
        cache_key = _compute_request_hash(load, material, pop_size, n_gen)
        cache_path = CACHE_DIR / f"{cache_key}.json"

        if cache_path.exists():
            print(f"[API] Cache hit: {cache_key}")
            cached_results = _load_cached_results(cache_path)
            if cached_results:
                _ensure_design_assets(cached_results)
                return jsonify({
                    'success': True,
                    'results': cached_results,
                    'cached': True,
                    'cache_key': cache_key
                })
            else:
                print(f"[API] Cache invalid, recomputing: {cache_key}")

        # Cache miss → run optimization
        results = run_optimization(
            load=load,
            material_name=material,
            pop_size=pop_size,
            n_gen=n_gen
        )

        # Generate STL files for each design
        for design in results['pareto_front']:
            try:
                stl_path = generate_bracket_stl(
                    params=design['parameters'],
                    output_dir=app.config['MODELS_FOLDER']
                )
                # Add STL filename to design
                design['stl_file'] = os.path.basename(stl_path)

                # Cache design for later download
                optimization_cache[str(design['id'])] = design
            except Exception as e:
                print(
                    f"[API] Warning: STL generation failed for design {design['id']}: {e}")
                design['stl_file'] = None

        print(
            f"[API] Optimization complete: {len(results['pareto_front'])} designs")

        # Persist results to disk cache
        cache_payload = {
            'inputs': {
                'load': load,
                'material': material,
                'pop_size': pop_size,
                'n_gen': n_gen
            },
            'results': results,
            'cached_at': time.time()
        }
        try:
            with open(cache_path, 'w') as f:
                json.dump(cache_payload, f, indent=2)
            print(f"[API] Cache stored: {cache_key}")
        except Exception as cache_exc:
            print(
                f"[API] Warning: failed to write cache {cache_key}: {cache_exc}")

        return jsonify({
            'success': True,
            'results': results,
            'cached': False,
            'cache_key': cache_key
        })

    except Exception as e:
        print(f"[API] Error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/demo', methods=['GET'])
def demo_results():
    """
    Return pre-computed optimization results for fast demo.
    """
    try:
        # Check if we have saved results
        results_file = 'data/demo_results.json'

        if os.path.exists(results_file):
            with open(results_file, 'r') as f:
                results = json.load(f)
            return jsonify({
                'success': True,
                'results': results,
                'cached': True
            })
        else:
            # Generate demo results on-the-fly
            print("[API] Generating demo results...")
            results = run_optimization(
                load=50.0,
                material_name='PLA',
                pop_size=30,
                n_gen=40
            )

            # Generate STL files
            for design in results['pareto_front']:
                try:
                    stl_path = generate_bracket_stl(
                        params=design['parameters'],
                        output_dir=app.config['MODELS_FOLDER']
                    )
                    design['stl_file'] = os.path.basename(stl_path)
                except:
                    design['stl_file'] = None

            # Save for next time
            with open(results_file, 'w') as f:
                json.dump(results, f, indent=2)

            return jsonify({
                'success': True,
                'results': results,
                'cached': False
            })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/models/<filename>')
def serve_model(filename):
    """Serve STL files."""
    try:
        return send_from_directory(app.config['MODELS_FOLDER'], filename)
    except Exception as e:
        return jsonify({'error': 'File not found'}), 404


@app.route('/api/download/<design_id>', methods=['GET'])
def download_manufacturing_pack(design_id):
    """
    Generate downloadable manufacturing package for a design.

    Includes:
    - STL file
    - Print settings (JSON)
    - Bill of Materials (BOM.txt)
    - Quality Control Checklist (QC_Checklist.txt)
    """
    try:
        # Get design from cache
        design = get_design_by_id(design_id)

        if not design:
            return jsonify({
                'success': False,
                'error': f'Design {design_id} not found. Run optimization first.'
            }), 404

        if not design.get('stl_file'):
            return jsonify({
                'success': False,
                'error': 'STL file not available for this design'
            }), 404

        # Create ZIP in memory
        zip_buffer = BytesIO()

        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # Add STL
            stl_path = os.path.join(
                app.config['MODELS_FOLDER'], design['stl_file'])
            if os.path.exists(stl_path):
                zip_file.write(stl_path, f"bracket_design_{design_id}.stl")

            # Add print profile
            print_profile = {
                "material": "PLA",
                "nozzle_temp": 210,
                "bed_temp": 60,
                "layer_height": 0.2,
                "infill": 20,
                "supports": False,
                "estimated_time": "45 minutes",
                "estimated_filament": f"{design['mass']}g"
            }
            zip_file.writestr("print_settings.json",
                              json.dumps(print_profile, indent=2))

            # Add BOM
            bom = f"""Bill of Materials - Design {design_id}

Material: PLA Filament
Quantity: {design['mass']}g
Cost: ₹{design['cost']}

Hardware:
- M5 bolts (x2)
- M5 nuts (x2)

Tools Required:
- 3D printer (FDM, 0.4mm nozzle)
- Hex wrench (4mm)

Design Parameters:
- Base Length: {design['parameters']['base_length']}mm
- Base Width: {design['parameters']['base_width']}mm
- Base Thickness: {design['parameters']['base_thickness']}mm
- Rib Count: {design['parameters']['rib_count']}
- Rib Thickness: {design['parameters']['rib_thickness']}mm
- Fillet Radius: {design['parameters']['fillet_radius']}mm
- Hole Diameter: {design['parameters']['hole_diameter']}mm
"""
            zip_file.writestr("BOM.txt", bom)

            # Add QC checklist
            qc = """Quality Control Checklist

1. Visual Inspection:
   [ ] No warping or layer separation
   [ ] Holes are clear and round
   [ ] No stringing or blobs

2. Dimensional Check:
   [ ] Length: {:.1f}mm ±0.5mm
   [ ] Width: {:.1f}mm ±0.5mm
   [ ] Thickness: {:.1f}mm ±0.2mm
   [ ] Hole diameter: {:.1f}mm ±0.1mm

3. Functional Test:
   [ ] Bolts fit without force
   [ ] No cracks under finger pressure
   [ ] Mates flush with mounting surface

4. Load Test (Optional):
   [ ] Holds 50N for 30 seconds without visible deflection

5. Safety Verification:
   [ ] Predicted stress: {:.2f} MPa (± {:.2f} MPa at 95% CI)
   [ ] Predicted deflection: {:.4f} mm (± {:.4f} mm at 95% CI)
   [ ] Safety factor meets requirements
""".format(
                design['parameters']['base_length'],
                design['parameters']['base_width'],
                design['parameters']['base_thickness'],
                design['parameters']['hole_diameter'],
                design.get('stress_predicted', 0),
                design.get('stress_confidence_95', 0),
                design.get('deflection_predicted', 0),
                design.get('deflection_confidence_95', 0)
            )
            zip_file.writestr("QC_Checklist.txt", qc)

            # Add README
            readme = f"""AI-Optimized Prosthetic Bracket - Design {design_id}
{"=" * 60}

This package contains everything needed to manufacture and validate
this AI-optimized prosthetic bracket design.

CONTENTS:
---------
1. bracket_design_{design_id}.stl - 3D printable model
2. print_settings.json - Recommended 3D printer settings
3. BOM.txt - Complete bill of materials
4. QC_Checklist.txt - Quality control verification steps
5. README.txt - This file

SPECIFICATIONS:
---------------
Mass: {design['mass']}g
Cost: ₹{design['cost']}
Stress (predicted): {design.get('stress_predicted', 'N/A')} ± {design.get('stress_confidence_95', 'N/A')} MPa
Deflection (predicted): {design.get('deflection_predicted', 'N/A')} ± {design.get('deflection_confidence_95', 'N/A')} mm

MANUFACTURING INSTRUCTIONS:
---------------------------
1. Load bracket_design_{design_id}.stl into your slicer software
2. Apply settings from print_settings.json
3. Print with PLA filament (recommended)
4. Remove supports if any
5. Clean holes with 5mm drill bit if needed
6. Follow QC_Checklist.txt for quality verification

NOTES:
------
- This design was optimized using NSGA-II multi-objective optimization
- Predictions include 95% confidence intervals from ensemble ML models
- Always perform load testing before clinical use
- Design meets DFM (Design for Manufacturing) requirements

Generated by: AI Prosthetic Optimizer v1.0
Generated on: {os.popen('date').read().strip()}
"""
            zip_file.writestr("README.txt", readme)

        zip_buffer.seek(0)

        print(f"[API] Manufacturing pack generated for design {design_id}")

        return send_file(
            zip_buffer,
            mimetype='application/zip',
            as_attachment=True,
            download_name=f'bracket_manufacturing_pack_{design_id}.zip'
        )

    except Exception as e:
        print(f"[API] Error generating manufacturing pack: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/material-advice', methods=['POST'])
def material_advice():
    """
    Get smart material recommendation based on application requirements.

    Request body:
        load (float): Applied load in Newtons
        environment (str): "medical", "industrial", "outdoor", or "general"
        budget (str): "low", "medium", or "high"

    Returns:
        Recommendation with material, rationale, design tips, and alternatives
    """
    try:
        data = request.get_json()

        # Validate inputs
        load = float(data.get('load', 100))
        environment = data.get('environment', 'general')
        budget = data.get('budget', 'medium')

        # Validate environment
        valid_environments = ['medical', 'industrial', 'outdoor', 'general']
        if environment.lower() not in valid_environments:
            return jsonify({
                'success': False,
                'error': f'Invalid environment. Must be one of: {", ".join(valid_environments)}'
            }), 400

        # Validate budget
        valid_budgets = ['low', 'medium', 'high']
        if budget.lower() not in valid_budgets:
            return jsonify({
                'success': False,
                'error': f'Invalid budget. Must be one of: {", ".join(valid_budgets)}'
            }), 400

        # Validate load
        if load <= 0:
            return jsonify({
                'success': False,
                'error': 'Load must be greater than 0'
            }), 400

        print(
            f"[API] Material advice request: {load}N, {environment}, {budget} budget")

        # Get recommendation from advisor
        advisor = get_material_advisor()
        recommendation = advisor.get_recommendation(load, environment, budget)

        # Get material comparison
        comparison = advisor.compare_materials(load)

        print(f"[API] Recommended: {recommendation['material']}")

        return jsonify({
            'success': True,
            'recommendation': recommendation,
            'comparison': comparison
        })

    except ValueError as e:
        return jsonify({
            'success': False,
            'error': f'Invalid input: {str(e)}'
        }), 400
    except Exception as e:
        print(f"[API] Error in material advice: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/status', methods=['GET'])
def status():
    """Get API status and statistics."""
    try:
        # Count available models (safely handle missing directory)
        model_count = 0
        models_dir = app.config['MODELS_FOLDER']
        if os.path.exists(models_dir):
            model_count = len([f for f in os.listdir(
                models_dir) if f.endswith('.stl')])

        return jsonify({
            'success': True,
            'status': 'operational',
            'models_generated': model_count,
            'version': '1.0.0'
        })
    except Exception as e:
        print(f"[API] Status check error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    print("=" * 70)
    print("AI PROSTHETIC OPTIMIZER API")
    print("=" * 70)
    print("\n🚀 Starting Flask server...")
    print("📡 API will be available at: http://localhost:5000")
    print("\nEndpoints:")
    print("  GET  /api/materials        - List available materials")
    print("  POST /api/optimize         - Run optimization")
    print("  GET  /api/demo             - Get demo results (fast)")
    print("  POST /api/material-advice  - Get smart material recommendation")
    print("  GET  /api/status           - API health check")
    print("  GET  /models/<file>        - Serve STL files")
    print("  GET  /api/download/<id>    - Download manufacturing pack (ZIP)")
    print("\n" + "=" * 70)

    app.run(debug=True, host='0.0.0.0', port=5000)
