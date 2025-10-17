/**
 * AI Prosthetic Optimizer - Frontend Logic
 * Chart rendering, 3D visualization, UI interactions
 * (Config, Toast, and API functions moved to separate modules)
 */

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 AI Prosthetic Optimizer initialized');
    init3DViewer();
});

/**
 * Display optimization results
 */
function displayResults(results) {
    const paretoFront = results.pareto_front;

    if (!paretoFront || paretoFront.length === 0) {
        alert('No feasible designs found. Try relaxing constraints.');
        return;
    }

    // Clear any existing comparison
    clearComparison();
    comparisonMode = false;
    const compareBtn = document.getElementById('compare-btn');
    if (compareBtn) {
        compareBtn.textContent = '🔍 Compare Designs';
        compareBtn.className = 'px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold text-sm';
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
                backgroundColor: function (context) {
                    const index = context.dataIndex;
                    const design = paretoFront[dataPoints[index].designIndex];
                    // Highlight selected designs for comparison
                    if (selectedDesigns.some(d => d.id === design.id)) {
                        return selectedDesigns[0]?.id === design.id ?
                            'rgba(16, 185, 129, 0.9)' : // Green for Design A
                            'rgba(245, 158, 11, 0.9)';  // Amber for Design B
                    }
                    return 'rgba(59, 130, 246, 0.7)';
                },
                borderColor: function (context) {
                    const index = context.dataIndex;
                    const design = paretoFront[dataPoints[index].designIndex];
                    if (selectedDesigns.some(d => d.id === design.id)) {
                        return selectedDesigns[0]?.id === design.id ?
                            'rgba(16, 185, 129, 1)' :
                            'rgba(245, 158, 11, 1)';
                    }
                    return 'rgba(59, 130, 246, 1)';
                },
                borderWidth: 2,
                pointRadius: function (context) {
                    const index = context.dataIndex;
                    const design = paretoFront[dataPoints[index].designIndex];
                    return selectedDesigns.some(d => d.id === design.id) ? 10 : 8;
                },
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

                    // Check if shift key is pressed for comparison mode
                    if (event.native.shiftKey || comparisonMode) {
                        handleComparisonSelect(design);
                    } else {
                        selectDesign(design);
                    }
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
 * Toggle comparison mode
 */
function toggleComparisonMode() {
    comparisonMode = !comparisonMode;
    const button = document.getElementById('compare-btn');

    if (comparisonMode) {
        button.textContent = '🔍 Comparison Mode: ON';
        button.className = 'px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold';
        showToast('🔍 Comparison Mode activated! Click on 2 designs to compare.', 'info', 4000);
    } else {
        button.textContent = '🔍 Compare Designs';
        button.className = 'px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold';
        // Clear selections when turning off
        clearComparison();
    }
}

/**
 * Handle design selection for comparison
 */
function handleComparisonSelect(design) {
    // Check if design is already selected
    const existingIndex = selectedDesigns.findIndex(d => d.id === design.id);

    if (existingIndex !== -1) {
        // Deselect if clicking same design
        selectedDesigns.splice(existingIndex, 1);
    } else if (selectedDesigns.length < 2) {
        // Add to selection (max 2)
        selectedDesigns.push(design);
    } else {
        // Replace oldest selection
        selectedDesigns.shift();
        selectedDesigns.push(design);
    }

    // Update chart colors
    if (paretoChart) {
        paretoChart.update();
    }

    // Show/update comparison card
    if (selectedDesigns.length === 2) {
        displayComparison();
    } else if (selectedDesigns.length === 1) {
        // Show partial selection
        document.getElementById('comparison-card').classList.remove('hidden');
        document.getElementById('comparison-content').innerHTML = `
            <p class="text-sm text-gray-600 text-center py-4">
                <span class="font-semibold text-green-600">Design ${selectedDesigns[0].id + 1}</span> selected.<br>
                <span class="text-xs">Shift+Click or use Compare Mode to select a second design</span>
            </p>
        `;
    } else {
        // Hide if no selections
        document.getElementById('comparison-card').classList.add('hidden');
    }
}

/**
 * Display comparison card with delta calculations
 */
function displayComparison() {
    const designA = selectedDesigns[0];
    const designB = selectedDesigns[1];

    // Calculate deltas
    const massDelta = designB.mass - designA.mass;
    const costDelta = designB.cost - designA.cost;

    // Calculate safety factors
    const stressA = designA.stress_predicted || 0;
    const stressB = designB.stress_predicted || 0;

    // Get material yield strength from current results
    const yieldStrength = currentResults?.material?.yield_strength || 300; // Default if not available
    const safetyA = stressA > 0 ? yieldStrength / stressA : 0;
    const safetyB = stressB > 0 ? yieldStrength / stressB : 0;
    const safetyDeltaPercent = safetyA > 0 ? ((safetyB - safetyA) / safetyA * 100) : 0;

    const printScoreDelta = (designB.print_score || 0) - (designA.print_score || 0);
    const co2Delta = (designB.co2_kg || 0) - (designA.co2_kg || 0);
    const efficiencyDelta = (designB.efficiency_index || 0) - (designA.efficiency_index || 0);

    // Helper function to format delta with color
    const formatDelta = (value, unit = '', inverse = false) => {
        const isPositive = value > 0;
        const displayPositive = inverse ? !isPositive : isPositive;
        const color = displayPositive ? 'text-green-600' : 'text-red-600';
        const sign = value > 0 ? '+' : '';
        return `<span class="${color} font-semibold">${sign}${value.toFixed(value < 1 ? 3 : 2)}${unit}</span>`;
    };

    const formatPercent = (value) => {
        const color = value > 0 ? 'text-green-600' : 'text-red-600';
        const sign = value > 0 ? '+' : '';
        return `<span class="${color} font-semibold">${sign}${value.toFixed(1)}%</span>`;
    };

    const comparisonHTML = `
        <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-3 py-2 text-left font-semibold text-gray-700">Metric</th>
                        <th class="px-3 py-2 text-center font-semibold text-green-700">
                            <span class="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span>
                            Design ${designA.id + 1}
                        </th>
                        <th class="px-3 py-2 text-center font-semibold text-amber-700">
                            <span class="inline-block w-3 h-3 rounded-full bg-amber-500 mr-1"></span>
                            Design ${designB.id + 1}
                        </th>
                        <th class="px-3 py-2 text-center font-semibold text-gray-700">Δ (B - A)</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    <tr class="hover:bg-gray-50">
                        <td class="px-3 py-2 font-medium text-gray-700">Mass (g)</td>
                        <td class="px-3 py-2 text-center">${designA.mass.toFixed(2)}</td>
                        <td class="px-3 py-2 text-center">${designB.mass.toFixed(2)}</td>
                        <td class="px-3 py-2 text-center">${formatDelta(massDelta, 'g', true)}</td>
                    </tr>
                    <tr class="hover:bg-gray-50">
                        <td class="px-3 py-2 font-medium text-gray-700">Cost (₹)</td>
                        <td class="px-3 py-2 text-center">₹${designA.cost.toFixed(2)}</td>
                        <td class="px-3 py-2 text-center">₹${designB.cost.toFixed(2)}</td>
                        <td class="px-3 py-2 text-center">${formatDelta(costDelta, '₹', true)}</td>
                    </tr>
                    <tr class="hover:bg-gray-50">
                        <td class="px-3 py-2 font-medium text-gray-700">Safety Factor</td>
                        <td class="px-3 py-2 text-center">${safetyA.toFixed(2)}</td>
                        <td class="px-3 py-2 text-center">${safetyB.toFixed(2)}</td>
                        <td class="px-3 py-2 text-center">${formatPercent(safetyDeltaPercent)}</td>
                    </tr>
                    <tr class="hover:bg-gray-50">
                        <td class="px-3 py-2 font-medium text-gray-700">Print Score</td>
                        <td class="px-3 py-2 text-center">${designA.print_score || 0}/100</td>
                        <td class="px-3 py-2 text-center">${designB.print_score || 0}/100</td>
                        <td class="px-3 py-2 text-center">${formatDelta(printScoreDelta, '', false)}</td>
                    </tr>
                    <tr class="hover:bg-gray-50">
                        <td class="px-3 py-2 font-medium text-gray-700">CO₂ (kg)</td>
                        <td class="px-3 py-2 text-center">${(designA.co2_kg || 0).toFixed(3)}</td>
                        <td class="px-3 py-2 text-center">${(designB.co2_kg || 0).toFixed(3)}</td>
                        <td class="px-3 py-2 text-center">${formatDelta(co2Delta, 'kg', true)}</td>
                    </tr>
                    <tr class="hover:bg-gray-50">
                        <td class="px-3 py-2 font-medium text-gray-700">Efficiency</td>
                        <td class="px-3 py-2 text-center">${(designA.efficiency_index || 0).toFixed(2)}</td>
                        <td class="px-3 py-2 text-center">${(designB.efficiency_index || 0).toFixed(2)}</td>
                        <td class="px-3 py-2 text-center">${formatDelta(efficiencyDelta, '', false)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="mt-3 text-xs text-gray-600 bg-blue-50 p-2 rounded">
            <strong>💡 Interpretation:</strong>
            <span class="text-green-600">Green</span> = better, 
            <span class="text-red-600">Red</span> = worse (lower mass/cost/CO₂ are better)
        </div>
    `;

    document.getElementById('comparison-card').classList.remove('hidden');
    document.getElementById('comparison-content').innerHTML = comparisonHTML;
}

/**
 * Clear comparison selection
 */
function clearComparison() {
    selectedDesigns = [];
    document.getElementById('comparison-card').classList.add('hidden');

    // Update chart colors
    if (paretoChart) {
        paretoChart.update();
    }
}

/**
 * Initialize Three.js 3D viewer
 */
function init3DViewer() {
    const container = document.getElementById('viewer-container');
    if (!container) {
        console.warn('Viewer container not found.');
        return;
    }

    const parent = container.parentElement;
    const initialWidth = container.clientWidth || (parent ? parent.clientWidth : 0) || 600;
    const initialHeight = container.clientHeight || (parent ? parent.clientHeight : 0) || 400;

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a202c);

    // Camera
    camera = new THREE.PerspectiveCamera(45, initialWidth / initialHeight, 0.1, 1000);
    camera.position.set(80, 80, 80);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(initialWidth, initialHeight);
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
    window.addEventListener('resize', resizeViewer);

    // Ensure sizing is correct even when container starts hidden
    requestAnimationFrame(resizeViewer);

    console.log('✅ 3D viewer initialized');
}

function resizeViewer() {
    if (!renderer || !camera) {
        return;
    }

    const container = document.getElementById('viewer-container');
    if (!container) {
        return;
    }

    let width = container.clientWidth;
    let height = container.clientHeight;

    if (!width || !height) {
        const parent = container.parentElement;
        width = width || (parent ? parent.clientWidth : 0) || 600;
        height = height || (parent ? parent.clientHeight : 0) || 400;
    }

    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
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

            // Auto-expand 3D viewer section
            const section = document.getElementById('viewer-section');
            const icon = document.getElementById('viewer-toggle-icon');
            if (section && section.classList.contains('hidden')) {
                section.classList.remove('hidden');
                if (icon) icon.textContent = '▲';
                requestAnimationFrame(resizeViewer);
            }

            requestAnimationFrame(resizeViewer);

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
// REMOVED: downloadManufacturingPack() - Now in js/api.js

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

    // Auto-expand AI Mentor section
    const section = document.getElementById('mentor-section');
    const icon = document.getElementById('mentor-toggle-icon');
    if (section && section.classList.contains('hidden')) {
        section.classList.remove('hidden');
        if (icon) icon.textContent = '▲';
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

/**
 * Material Advisor Functions
 */

/**
 * Open material advisor modal
 */
function openMaterialAdvisor() {
    // Pre-fill with current settings
    const currentLoad = document.getElementById('load-input').value;
    document.getElementById('advisor-load').value = currentLoad;

    // Show modal
    document.getElementById('advisor-modal').classList.remove('hidden');

    // Hide results, show form
    document.getElementById('advisor-results').classList.add('hidden');
}

/**
 * Close material advisor modal
 */
function closeMaterialAdvisor() {
    document.getElementById('advisor-modal').classList.add('hidden');
}

/**
 * Close modal when clicking backdrop
 */
function closeModalOnBackdrop(event) {
    if (event.target.id === 'advisor-modal') {
        closeMaterialAdvisor();
    }
}

/**
 * Get material advice from backend
 */
// REMOVED: getMaterialAdvice() - Now in js/api.js

/**
 * Display material recommendation in modal
 */
function displayMaterialRecommendation(recommendation, comparison) {
    if (!recommendation) {
        showToast('No recommendation data received.', 'error');
        return;
    }

    // Persist latest recommendation for "Apply" CTA
    currentRecommendation = recommendation;

    const rationaleItems = Array.isArray(recommendation.rationale) ? recommendation.rationale : [];
    const designTips = Array.isArray(recommendation.design_tips) ? recommendation.design_tips : [];
    const alternatives = Array.isArray(recommendation.alternatives) ? recommendation.alternatives : [];
    const comparisonRows = Array.isArray(comparison) ? comparison : [];

    // Show results container
    document.getElementById('advisor-results').classList.remove('hidden');

    // Display recommended material
    document.getElementById('recommended-material').textContent = recommendation.material_name;
    document.getElementById('manufacturing-method').textContent = recommendation.manufacturing_method;
    document.getElementById('material-cost').textContent = recommendation.estimated_cost_per_kg.toFixed(0);
    document.getElementById('material-strength').textContent = recommendation.yield_strength.toFixed(0);
    document.getElementById('material-co2').textContent = recommendation.co2_per_kg.toFixed(1);

    // Display rationale
    const rationaleList = document.getElementById('rationale-list');
    rationaleList.innerHTML = rationaleItems.length ? rationaleItems.map(reason => {
        const isWarning = typeof reason === 'string' && (reason.includes('⚠️') || reason.includes('Warning'));
        const bgClass = isWarning ? 'bg-yellow-100 border-yellow-300' : 'bg-white';
        const icon = isWarning ? '⚠️' : '✓';
        const text = typeof reason === 'string' ? reason : String(reason ?? '');
        return `
            <li class="flex items-start ${bgClass} p-2 rounded border">
                <span class="mr-2">${icon}</span>
                <span class="text-gray-700">${text}</span>
            </li>
        `;
    }).join('') : '<li class="text-gray-500 text-sm">No rationale provided.</li>';

    // Display design tips
    const tipsList = document.getElementById('design-tips-list');
    tipsList.innerHTML = designTips.length ? designTips.map(tip => {
        const text = typeof tip === 'string' ? tip : String(tip ?? '');
        return `
        <li class="flex items-start bg-white p-2 rounded border border-yellow-200">
            <span class="mr-2">💡</span>
            <span class="text-gray-700">${text}</span>
        </li>`;
    }).join('') : '<li class="text-gray-500 text-sm">No design tips available.</li>';

    // Display alternatives if any
    if (alternatives.length > 0) {
        document.getElementById('alternatives-section').classList.remove('hidden');
        const alternativesList = document.getElementById('alternatives-list');
        alternativesList.innerHTML = alternatives.map(([material, reason]) => `
            <div class="bg-gray-50 p-3 rounded border border-gray-200">
                <span class="font-semibold text-gray-800">${material}:</span>
                <span class="text-gray-600">${reason}</span>
            </div>
        `).join('');
    } else {
        document.getElementById('alternatives-section').classList.add('hidden');
    }

    // Display comparison table
    const tableBody = document.getElementById('comparison-table-body');
    tableBody.innerHTML = comparisonRows.length ? comparisonRows.map(item => {
        // Color code suitability
        let suitabilityClass = 'text-gray-600';
        if (item.suitability === 'Excellent') suitabilityClass = 'text-green-600 font-semibold';
        else if (item.suitability === 'Good') suitabilityClass = 'text-blue-600 font-semibold';
        else if (item.suitability === 'Acceptable') suitabilityClass = 'text-yellow-600 font-semibold';
        else if (item.suitability === 'Insufficient') suitabilityClass = 'text-red-600 font-semibold';

        // Highlight recommended material
        const isRecommended = item.material === recommendation.material;
        const rowClass = isRecommended ? 'bg-green-50 font-semibold' : 'hover:bg-gray-50';

        return `
            <tr class="${rowClass}">
                <td class="px-4 py-2">
                    ${isRecommended ? '⭐ ' : ''}${item.material_name}
                </td>
                <td class="px-4 py-2 text-center">${item.safety_factor.toFixed(2)}</td>
                <td class="px-4 py-2 text-center">₹${item.cost_per_kg.toFixed(0)}</td>
                <td class="px-4 py-2 text-center">${item.co2_per_kg.toFixed(1)}</td>
                <td class="px-4 py-2 text-center ${suitabilityClass}">${item.suitability}</td>
            </tr>
        `;
    }).join('') : '<tr><td colspan="5" class="px-4 py-3 text-center text-gray-500">No comparison data available.</td></tr>';
}

/**
 * Apply recommended material to main form
 */
function applyRecommendedMaterial() {
    if (!currentRecommendation) {
        showToast('No recommendation available', 'error');
        return;
    }

    // Update material select
    const materialSelect = document.getElementById('material-select');
    materialSelect.value = currentRecommendation.material;

    // Update load if different
    const advisorLoad = parseFloat(document.getElementById('advisor-load').value);
    document.getElementById('load-input').value = advisorLoad;

    // Close modal
    closeMaterialAdvisor();

    // Show success toast
    showToast(
        `✓ Material set to ${currentRecommendation.material_name}, Load set to ${advisorLoad}N. Ready to optimize!`,
        'success',
        5000
    );
}

/**
 * Toggle 3D Viewer section visibility
 */
function toggle3DViewer() {
    const section = document.getElementById('viewer-section');
    const icon = document.getElementById('viewer-toggle-icon');

    if (section.classList.contains('hidden')) {
        section.classList.remove('hidden');
        if (icon) icon.textContent = '▲';
        requestAnimationFrame(resizeViewer);
    } else {
        section.classList.add('hidden');
        if (icon) icon.textContent = '▼';
    }
}

/**
 * Toggle AI Mentor section visibility
 */
function toggleMentor() {
    const section = document.getElementById('mentor-section');
    const icon = document.getElementById('mentor-toggle-icon');

    if (section.classList.contains('hidden')) {
        section.classList.remove('hidden');
        if (icon) icon.textContent = '▲';
    } else {
        section.classList.add('hidden');
        if (icon) icon.textContent = '▼';
    }
}

// Expose UI helpers for inline handlers and API module
window.displayResults = displayResults;
window.displayMentorInsights = displayMentorInsights;
window.toggleComparisonMode = toggleComparisonMode;
window.clearComparison = clearComparison;
window.sortTable = sortTable;
window.selectDesignById = selectDesignById;
window.openMaterialAdvisor = openMaterialAdvisor;
window.closeMaterialAdvisor = closeMaterialAdvisor;
window.closeModalOnBackdrop = closeModalOnBackdrop;
window.displayMaterialRecommendation = displayMaterialRecommendation;
window.applyRecommendedMaterial = applyRecommendedMaterial;
window.toggle3DViewer = toggle3DViewer;
window.toggleMentor = toggleMentor;
