"""
Simple STL Geometry Generator
Creates 3D models of prosthetic brackets using numpy-stl primitives.
"""

import numpy as np
from stl import mesh as stl_mesh
import os


def create_box_mesh(origin, dimensions):
    """
    Create a box mesh (8 vertices, 12 triangles).

    Args:
        origin: [x, y, z] starting point
        dimensions: [dx, dy, dz] size

    Returns:
        vertices, faces arrays
    """
    x, y, z = origin
    dx, dy, dz = dimensions

    # Define 8 vertices of box
    vertices = np.array([
        [x, y, z],           # 0: bottom-left-front
        [x+dx, y, z],        # 1: bottom-right-front
        [x+dx, y+dy, z],     # 2: bottom-right-back
        [x, y+dy, z],        # 3: bottom-left-back
        [x, y, z+dz],        # 4: top-left-front
        [x+dx, y, z+dz],     # 5: top-right-front
        [x+dx, y+dy, z+dz],  # 6: top-right-back
        [x, y+dy, z+dz]      # 7: top-left-back
    ])

    # Define 12 triangular faces (2 per box face)
    faces = np.array([
        # Bottom (z=0)
        [0, 3, 1], [1, 3, 2],
        # Top (z=dz)
        [4, 5, 7], [5, 6, 7],
        # Front (y=0)
        [0, 1, 5], [0, 5, 4],
        # Back (y=dy)
        [2, 3, 6], [3, 7, 6],
        # Left (x=0)
        [0, 4, 7], [0, 7, 3],
        # Right (x=dx)
        [1, 2, 6], [1, 6, 5]
    ])

    return vertices, faces


def generate_bracket_stl(params, output_dir='data/models'):
    """
    Generate STL file for prosthetic bracket.

    Args:
        params (dict): Design parameters
        output_dir (str): Output directory for STL files

    Returns:
        str: Path to generated STL file
    """
    # Create output directory if needed
    os.makedirs(output_dir, exist_ok=True)

    all_vertices = []
    all_faces = []
    vertex_offset = 0

    # 1. Create base plate
    base_verts, base_faces = create_box_mesh(
        origin=[0, 0, 0],
        dimensions=[params['base_length'],
                    params['base_width'], params['base_thickness']]
    )
    all_vertices.append(base_verts)
    all_faces.append(base_faces + vertex_offset)
    vertex_offset += len(base_verts)

    # 2. Create ribs (vertical reinforcements)
    rib_height = 20  # mm (fixed)
    rib_spacing = params['base_length'] / (params['rib_count'] + 1)

    for i in range(params['rib_count']):
        x_pos = rib_spacing * (i + 1) - params['rib_thickness'] / 2

        rib_verts, rib_faces = create_box_mesh(
            origin=[x_pos, 0, params['base_thickness']],
            dimensions=[params['rib_thickness'],
                        params['base_width'], rib_height]
        )
        all_vertices.append(rib_verts)
        all_faces.append(rib_faces + vertex_offset)
        vertex_offset += len(rib_verts)

    # 3. Combine all meshes
    combined_vertices = np.vstack(all_vertices)
    combined_faces = np.vstack(all_faces)

    # 4. Create STL mesh
    bracket_mesh = stl_mesh.Mesh(
        np.zeros(combined_faces.shape[0], dtype=stl_mesh.Mesh.dtype))

    for i, face in enumerate(combined_faces):
        for j in range(3):
            bracket_mesh.vectors[i][j] = combined_vertices[face[j]]

    # 5. Save STL file
    # Create unique filename based on parameters
    param_hash = abs(hash(str(sorted(params.items()))))
    filename = f"bracket_{param_hash}.stl"
    filepath = os.path.join(output_dir, filename)

    bracket_mesh.save(filepath)

    return filepath


# Test function
if __name__ == '__main__':
    print("Testing Geometry Generator...")
    print("=" * 60)

    # Test design
    test_params = {
        'base_length': 50.0,
        'base_width': 30.0,
        'base_thickness': 3.0,
        'rib_count': 3,
        'rib_thickness': 2.5,
        'fillet_radius': 2.0,
        'hole_diameter': 5.0
    }

    print("\nGenerating STL for test bracket...")
    stl_path = generate_bracket_stl(test_params)

    print(f"✅ STL file generated: {stl_path}")
    print(f"File size: {os.path.getsize(stl_path) / 1024:.1f} KB")

    # Generate optimal design from optimizer
    print("\nGenerating STL for AI-optimized design...")
    optimal_params = {
        'base_length': 40.01,
        'base_width': 35.03,
        'base_thickness': 4.38,
        'rib_count': 2,
        'rib_thickness': 1.51,
        'fillet_radius': 1.74,
        'hole_diameter': 4.85
    }

    optimal_stl = generate_bracket_stl(optimal_params)
    print(f"✅ Optimal design STL: {optimal_stl}")

    print("\n" + "=" * 60)
    print("🎉 Geometry generator working!")
    print("You can now open these STL files in any 3D viewer")
