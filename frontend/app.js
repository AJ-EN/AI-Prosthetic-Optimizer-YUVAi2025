/**
 * AI Prosthetic Optimizer - Frontend Logic
 * Handles API calls, chart rendering, and 3D visualization
 */

const API_BASE_URL = 'http://localhost:5000';

let currentResults = null;
let paretoChart = null;
let scene, camera, renderer, controls, currentMesh;
let currentDesignId = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 AI Prosthetic Optimizer initialized');
    init3DViewer();
});

/**
 * Run full optimization with user parameters
 */
async function runOptimization() {
    const load = parseFloat(document.getElementById('load-input').value);
    const material = document.getElementById('material-select').value;
    const popSize = parseInt(document.getElementById('pop-size').value);
    const generations = parseInt(document.getElementById('generations').value);

    console.log('Starting optimization:', { load, material, popSize, generations });

    // Show loading state
    document.getElementById('loading-state').classList.remove('hidden');
    document.getElementById('optimize-btn').disabled = true;
    document.getElementById('demo-btn').disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/optimize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                load: load,
                material: material,
                pop_size: popSize,
                n_gen: generations
            })
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ Optimization complete:', data.results);
            currentResults = data.results;
            displayResults(data.results);
        } else {
            alert('Optimization failed: ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to connect to API. Make sure Flask server is running on port 5000.');
    } finally {
        // Hide loading state
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('optimize-btn').disabled = false;
        document.getElementById('demo-btn').disabled = false;
    }
}

/**
 * Load pre-computed demo results (fast)
 */
async function loadDemo() {
    console.log('Loading demo results...');

    document.getElementById('loading-state').classList.remove('hidden');
    document.getElementById('demo-btn').disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/demo`);
        const data = await response.json();

        if (data.success) {
            console.log('✅ Demo loaded:', data.results);
            currentResults = data.results;
            displayResults(data.results);

            if (data.cached) {
                console.log('📦 Results were cached');
            }
        } else {
            alert('Failed to load demo: ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to connect to API. Make sure Flask server is running.');
    } finally {
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('demo-btn').disabled = false;
    }
}

/**
 * Display optimization results
 */
function displayResults(results) {
    const paretoFront = results.pareto_front;

    if (!paretoFront || paretoFront.length === 0) {
        alert('No feasible designs found. Try relaxing constraints.');
        return;
    }

    // Show results container
    document.getElementById('no-results').classList.add('hidden');
    document.getElementById('results-container').classList.remove('hidden');

    // Render Pareto chart
    renderParetoChart(paretoFront);

    // Select first design by default
    selectDesign(paretoFront[0]);
}

/**
 * Render Pareto front scatter plot
 */
function renderParetoChart(paretoFront) {
    const ctx = document.getElementById('pareto-chart').getContext('2d');

    // Destroy existing chart
    if (paretoChart) {
        paretoChart.destroy();
    }

    // Prepare data points
    const dataPoints = paretoFront.map((design, index) => ({
        x: design.mass,
        y: design.cost,
        designIndex: index
    }));

    paretoChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Pareto-Optimal Designs',
                data: dataPoints,
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 2,
                pointRadius: 8,
                pointHoverRadius: 12
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const design = paretoFront[dataPoints[index].designIndex];
                    selectDesign(design);
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Mass vs. Cost Trade-off',
                    font: { size: 16, weight: 'bold' }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `Design ${context.raw.designIndex + 1}: ${context.parsed.x.toFixed(2)}g, ₹${context.parsed.y.toFixed(2)}`;
                        }
                    }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Mass (grams)',
                        font: { size: 14, weight: 'bold' }
                    },
                    ticks: {
                        callback: function (value) {
                            return value.toFixed(1) + 'g';
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Cost (₹)',
                        font: { size: 14, weight: 'bold' }
                    },
                    ticks: {
                        callback: function (value) {
                            return '₹' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });

    console.log(`📊 Pareto chart rendered with ${paretoFront.length} designs`);
}

/**
 * Select and display a specific design
 */
function selectDesign(design) {
    console.log('Selected design:', design);

    // Store current design ID for download
    currentDesignId = design.id;

    // Update info panel
    document.getElementById('info-mass').textContent = design.mass.toFixed(2);
    document.getElementById('info-cost').textContent = design.cost.toFixed(2);
    document.getElementById('info-id').textContent = design.id + 1;

    // Display parameters
    const paramsDiv = document.getElementById('info-params');
    paramsDiv.innerHTML = Object.entries(design.parameters)
        .map(([key, value]) => {
            const displayValue = typeof value === 'number' ? value.toFixed(2) : value;
            return `<div><span class="font-medium">${key}:</span> ${displayValue}</div>`;
        })
        .join('');

    // Load 3D model if available
    if (design.stl_file) {
        load3DModel(design.stl_file);
    }
}

/**
 * Initialize Three.js 3D viewer
 */
function init3DViewer() {
    const container = document.getElementById('viewer-container');

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a202c);

    // Camera
    camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(80, 80, 80);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(1, 1, 1);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-1, -1, -1);
    scene.add(directionalLight2);

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Add grid
    const gridHelper = new THREE.GridHelper(100, 10, 0x444444, 0x222222);
    scene.add(gridHelper);

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    console.log('✅ 3D viewer initialized');
}

/**
 * Load STL model into 3D viewer
 */
function load3DModel(filename) {
    console.log('Loading 3D model:', filename);

    const loader = new THREE.STLLoader();
    const modelUrl = `${API_BASE_URL}/models/${filename}`;

    loader.load(
        modelUrl,
        function (geometry) {
            // Remove previous mesh
            if (currentMesh) {
                scene.remove(currentMesh);
            }

            // Create material
            const material = new THREE.MeshPhongMaterial({
                color: 0x3b82f6,
                specular: 0x111111,
                shininess: 200,
                flatShading: false
            });

            // Create mesh
            currentMesh = new THREE.Mesh(geometry, material);

            // Center geometry
            geometry.center();

            // Scale to fit view
            const box = new THREE.Box3().setFromObject(currentMesh);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 50 / maxDim;
            currentMesh.scale.multiplyScalar(scale);

            // Add to scene
            scene.add(currentMesh);

            // Reset camera
            controls.reset();

            console.log('✅ 3D model loaded');
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            console.error('Error loading STL:', error);
        }
    );
}

/**
 * Download manufacturing package for selected design
 */
async function downloadManufacturingPack(designId) {
    if (designId === null || designId === undefined) {
        alert('Please select a design first by clicking on a point in the Pareto chart.');
        return;
    }

    console.log(`📦 Downloading manufacturing pack for design ${designId}...`);

    try {
        // Show loading indicator
        const button = event.target;
        const originalText = button.innerHTML;
        button.innerHTML = '⏳ Preparing download...';
        button.disabled = true;

        // Fetch the ZIP file
        const response = await fetch(`${API_BASE_URL}/api/download/${designId}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Download failed');
        }

        // Get the blob
        const blob = await response.blob();

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bracket_manufacturing_pack_${designId}.zip`;
        document.body.appendChild(a);
        a.click();

        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        console.log('✅ Manufacturing pack downloaded successfully');

        // Reset button
        button.innerHTML = originalText;
        button.disabled = false;

        // Show success message
        alert('Manufacturing pack downloaded successfully! 📦\n\nThe ZIP file contains:\n- 3D model (STL)\n- Print settings\n- Bill of Materials\n- Quality Control Checklist\n- README with instructions');

    } catch (error) {
        console.error('Error downloading manufacturing pack:', error);
        alert(`Failed to download manufacturing pack: ${error.message}`);

        // Reset button on error
        const button = event.target;
        button.innerHTML = '📦 Download Manufacturing Pack';
        button.disabled = false;
    }
}
