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
            displayMentorInsights(data.results);
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

            // Display mentor insights if available
            if (data.results.mentor_log || data.results.mentor_summary) {
                displayMentorInsights(data.results);
            }

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

    // Populate designs table
    populateDesignsTable(paretoFront);

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

    // Update print readiness score with color coding
    const score = design.print_score || 0;
    const scoreElement = document.getElementById('readiness-score');
    const containerElement = document.getElementById('readiness-container');

    scoreElement.textContent = score;

    // Color code based on score
    if (score >= 80) {
        scoreElement.className = 'text-2xl font-bold text-green-600';
        containerElement.className = 'bg-white p-3 rounded-lg border-2 border-green-500';
    } else if (score >= 60) {
        scoreElement.className = 'text-2xl font-bold text-yellow-600';
        containerElement.className = 'bg-white p-3 rounded-lg border-2 border-yellow-500';
    } else {
        scoreElement.className = 'text-2xl font-bold text-red-600';
        containerElement.className = 'bg-white p-3 rounded-lg border-2 border-red-500';
    }

    // Update print time
    const printTime = design.print_time_hours || 0;
    document.getElementById('readiness-time').textContent = `Print time: ~${printTime.toFixed(1)}h`;

    // Update sustainability metrics
    const co2 = design.co2_kg || 0;
    const efficiency = design.efficiency_index || 0;

    document.getElementById('co2-value').textContent = co2.toFixed(3);
    document.getElementById('efficiency-value').textContent = efficiency.toFixed(2);

    // Update efficiency bar (scale to 0-100%, cap at efficiency of 20 for visualization)
    const maxEfficiency = 20; // Assume max efficiency of 20 for scaling
    const efficiencyPercent = Math.min((efficiency / maxEfficiency) * 100, 100);
    document.getElementById('efficiency-bar').style.width = `${efficiencyPercent}%`;

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

/**
 * Display AI Mentor insights from optimization
 */
function displayMentorInsights(results) {
    console.log('📚 Displaying AI Mentor insights');

    // Show mentor container, hide placeholder
    document.getElementById('mentor-container').classList.remove('hidden');
    document.getElementById('mentor-placeholder').classList.add('hidden');

    // Display generation log
    const logDiv = document.getElementById('mentor-log');
    if (results.mentor_log && results.mentor_log.length > 0) {
        logDiv.innerHTML = results.mentor_log
            .map(log => `
                <div class="flex items-start space-x-2 p-2 hover:bg-purple-50 rounded transition">
                    <span class="text-purple-600 text-sm">▸</span>
                    <span class="text-sm text-gray-700">${log}</span>
                </div>
            `)
            .join('');

        // Auto-scroll to bottom
        logDiv.scrollTop = logDiv.scrollHeight;
    } else {
        logDiv.innerHTML = '<p class="text-gray-500 text-sm">No generation logs available</p>';
    }

    // Display summary
    const summaryDiv = document.getElementById('mentor-summary');
    if (results.mentor_summary) {
        summaryDiv.textContent = results.mentor_summary;
    } else {
        summaryDiv.innerHTML = '<p class="text-gray-500">No summary insights available</p>';
    }

    console.log('✅ AI Mentor panel updated');
}

/**
 * Populate the designs comparison table
 */
function populateDesignsTable(designs) {
    const tbody = document.getElementById('designs-table-body');

    tbody.innerHTML = designs.map(design => {
        const score = design.print_score || 0;
        let badgeClass = 'bg-green-100 text-green-800';
        if (score < 60) badgeClass = 'bg-red-100 text-red-800';
        else if (score < 80) badgeClass = 'bg-yellow-100 text-yellow-800';

        const co2 = design.co2_kg || 0;
        const efficiency = design.efficiency_index || 0;

        return `
            <tr class="hover:bg-gray-50 cursor-pointer" onclick="selectDesignById(${design.id})">
                <td class="px-2 py-2">${design.id + 1}</td>
                <td class="px-2 py-2">${design.mass.toFixed(2)}</td>
                <td class="px-2 py-2">₹${design.cost.toFixed(2)}</td>
                <td class="px-2 py-2">
                    <span class="px-2 py-1 rounded-full text-xs font-semibold ${badgeClass}">
                        ${score}/100
                    </span>
                </td>
                <td class="px-2 py-2 text-green-700 font-semibold">${co2.toFixed(3)}</td>
                <td class="px-2 py-2 font-semibold">${efficiency.toFixed(2)}</td>
            </tr>
        `;
    }).join('');
}

/**
 * Select design by ID from table click
 */
function selectDesignById(designId) {
    if (!currentResults || !currentResults.pareto_front) return;

    const design = currentResults.pareto_front.find(d => d.id === designId);
    if (design) {
        selectDesign(design);
    }
}

/**
 * Sort table by column
 */
let currentSort = { column: null, ascending: true };

function sortTable(column) {
    if (!currentResults || !currentResults.pareto_front) return;

    const designs = [...currentResults.pareto_front];

    // Toggle sort direction if clicking same column
    if (currentSort.column === column) {
        currentSort.ascending = !currentSort.ascending;
    } else {
        currentSort.column = column;
        currentSort.ascending = true;
    }

    // Sort the designs
    designs.sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];

        // For ID, add 1 to match display
        if (column === 'id') {
            aVal += 1;
            bVal += 1;
        }

        if (currentSort.ascending) {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });

    // Repopulate table
    populateDesignsTable(designs);
}
