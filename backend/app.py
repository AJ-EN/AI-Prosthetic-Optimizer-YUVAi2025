"""
Flask API Server
Serves optimization results and STL files to frontend.
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import sys

# Import your modules
from optimizer import run_optimization
from geometry_generator import generate_bracket_stl
from material_library import load_materials

app = Flask(__name__)
CORS(app)  # Allow frontend to access API

# Configuration
app.config['MODELS_FOLDER'] = 'data/models'


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

        # Run optimization
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
            except Exception as e:
                print(
                    f"[API] Warning: STL generation failed for design {design['id']}: {e}")
                design['stl_file'] = None

        print(
            f"[API] Optimization complete: {len(results['pareto_front'])} designs")

        return jsonify({
            'success': True,
            'results': results
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


@app.route('/api/status', methods=['GET'])
def status():
    """Get API status and statistics."""
    try:
        # Count available models
        model_count = len([f for f in os.listdir(
            app.config['MODELS_FOLDER']) if f.endswith('.stl')])

        return jsonify({
            'success': True,
            'status': 'operational',
            'models_generated': model_count,
            'version': '1.0.0'
        })
    except Exception as e:
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
    print("  GET  /api/materials  - List available materials")
    print("  POST /api/optimize   - Run optimization")
    print("  GET  /api/demo       - Get demo results (fast)")
    print("  GET  /api/status     - API health check")
    print("  GET  /models/<file>  - Serve STL files")
    print("\n" + "=" * 70)

    app.run(debug=True, host='0.0.0.0', port=5000)