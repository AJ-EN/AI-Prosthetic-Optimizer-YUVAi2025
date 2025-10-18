/**
 * AI Prosthetic Optimizer - Frontend Logic
 * Chart rendering, 3D visualization, UI interactions
 * (Config, Toast, and API functions moved to separate modules)
 */

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    init3DViewer();
    refreshSystemStatus();
    setInterval(refreshSystemStatus, 30000);
});

/**
 * Update status badge content and styling
 */
function setStatusBadge(elementId, text, textClass, dotClass) {
    const element = document.getElementById(elementId);
    if (!element) {
        return;
    }

    element.className = `inline-flex items-center gap-2 ${textClass}`;
    element.innerHTML = `
        <span class="inline-block w-2 h-2 rounded-full ${dotClass}"></span>
        ${text}
    `;
}

/**
 * Ping backend for health and update hero status widgets
 */
async function refreshSystemStatus() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
        const response = await fetch(`${API_BASE_URL}/api/status`, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`Status request failed: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            const isOperational = data.status === 'operational';
            setStatusBadge('status-api', isOperational ? 'Online' : 'Degraded', isOperational ? 'text-black' : 'text-gray-600', isOperational ? 'bg-black animate-pulse' : 'bg-gray-400');

            const modelCount = data.models_generated ?? 0;
            const modelText = modelCount > 0 ? `${modelCount} STL ready` : 'No STL yet';
            setStatusBadge('status-models', modelText, modelCount > 0 ? 'text-black' : 'text-gray-600', modelCount > 0 ? 'bg-black' : 'bg-gray-400');

            const versionLabel = data.version ? `v${data.version}` : 'Version N/A';
            setStatusBadge('status-cache', versionLabel, 'text-gray-700', 'bg-gray-300');
            return;
        }

        throw new Error('Status endpoint returned error flag');
    } catch (error) {
        clearTimeout(timeout);
        setStatusBadge('status-api', 'Offline', 'text-gray-600', 'bg-gray-300');
        setStatusBadge('status-models', 'Unavailable', 'text-gray-600', 'bg-gray-300');
        setStatusBadge('status-cache', 'Check server', 'text-gray-600', 'bg-gray-300');
    }
}

/**
 * Display optimization results
 */
function displayResults(results) {
    const paretoFront = results.pareto_front;
    currentResults = results;

    if (!paretoFront || paretoFront.length === 0) {
        showToast('No feasible designs found. Try relaxing constraints or adjusting parameters.', 'info', 6000);
        return;
    }

    // Clear any existing comparison
    clearComparison();
    comparisonMode = false;
    updateCompareButtons(false);

    // Show results container
    document.getElementById('no-results').classList.add('hidden');
    document.getElementById('results-container').classList.remove('hidden');
    const primaryCompareBtn = document.getElementById('compare-btn');
    if (primaryCompareBtn) {
        primaryCompareBtn.classList.remove('hidden');
    }

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
                            'rgba(0, 0, 0, 0.9)' : // Black for Design A
                            'rgba(100, 100, 100, 0.8)';  // Gray for Design B
                    }
                    return 'rgba(150, 150, 150, 0.6)';
                },
                borderColor: function (context) {
                    const index = context.dataIndex;
                    const design = paretoFront[dataPoints[index].designIndex];
                    if (selectedDesigns.some(d => d.id === design.id)) {
                        return selectedDesigns[0]?.id === design.id ?
                            'rgba(0, 0, 0, 1)' :
                            'rgba(100, 100, 100, 1)';
                    }
                    return 'rgba(150, 150, 150, 1)';
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
}

/**
 * Select and display a specific design
 */
function selectDesign(design) {
    // Store current design ID for download
    currentDesignId = design.id;

    // Update info panel
    document.getElementById('info-mass').textContent = design.mass.toFixed(2);
    document.getElementById('info-cost').textContent = design.cost.toFixed(2);
    document.getElementById('info-id').textContent = design.id + 1;

    // Update print readiness score with color coding
    const score = design.print_score || 0;
    const scoreElement = document.getElementById('readiness-score');
    const readinessChip = document.getElementById('readiness-chip');

    if (scoreElement) {
        scoreElement.textContent = Math.round(score);
        scoreElement.className = 'mono-accent text-slate-100';
    }

    if (readinessChip) {
        readinessChip.classList.remove('chip-success', 'chip-warning', 'chip-error');

        if (score >= 80) {
            readinessChip.classList.add('chip-success');
        } else if (score >= 60) {
            readinessChip.classList.add('chip-warning');
        } else {
            readinessChip.classList.add('chip-error');
        }
    }

    // Update print time
    const printTime = design.print_time_hours || 0;
    const readinessTimeElement = document.getElementById('readiness-time');
    if (readinessTimeElement) {
        readinessTimeElement.textContent = `~${printTime.toFixed(1)} h`;
    }

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
function updateCompareButtons(isActive) {
    const primaryBtn = document.getElementById('compare-btn');
    const inlineBtn = document.getElementById('compare-btn-inline');

    if (primaryBtn) {
        primaryBtn.textContent = isActive ? '🟢 Comparison Mode: ON' : '🔍 Compare Designs';
        primaryBtn.className = `btn ${isActive ? 'btn-secondary' : 'btn-ghost'} btn-compact text-sm`;
    }

    if (inlineBtn) {
        inlineBtn.textContent = isActive ? '� Comparison Mode: ON' : '�🔍 Toggle Compare Mode';
        inlineBtn.className = `btn ${isActive ? 'btn-secondary' : 'btn-ghost'} btn-compact text-xs`;
    }
}

function toggleComparisonMode() {
    comparisonMode = !comparisonMode;
    updateCompareButtons(comparisonMode);

    if (comparisonMode) {
        showToast('🔍 Comparison Mode active. Select up to two designs to evaluate trade-offs.', 'info', 4000);
    } else {
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
            <p class="text-sm text-slate-300 text-center py-4">
                <span class="font-semibold text-emerald-300">Design ${selectedDesigns[0].id + 1}</span> pinned.<br>
                <span class="text-[11px] uppercase tracking-[0.25em] text-slate-500">Shift+Click or use Compare Mode to select a second design</span>
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
        const color = displayPositive ? 'text-gray-900' : 'text-gray-600';
        const sign = value > 0 ? '+' : value < 0 ? '-' : '';
        const precision = Math.abs(value) < 1 ? 3 : 2;
        return `<span class="${color} font-semibold mono-accent">${sign}${Math.abs(value).toFixed(precision)}${unit}</span>`;
    };

    const formatPercent = (value) => {
        const color = value > 0 ? 'text-gray-900' : 'text-gray-600';
        const sign = value > 0 ? '+' : value < 0 ? '-' : '';
        return `<span class="${color} font-semibold mono-accent">${sign}${Math.abs(value).toFixed(1)}%</span>`;
    };

    const comparisonHTML = `
        <div class="overflow-x-auto rounded-2xl border border-gray-300">
            <table class="min-w-full text-xs text-gray-900">
                <thead class="bg-gray-100 text-[11px] uppercase tracking-[0.3em] text-gray-700">
                    <tr>
                        <th class="px-4 py-3 text-left">Metric</th>
                        <th class="px-4 py-3 text-center text-gray-900">
                            <span class="inline-block w-2 h-2 rounded-full bg-black mr-2"></span>
                            Design ${designA.id + 1}
                        </th>
                        <th class="px-4 py-3 text-center text-gray-700">
                            <span class="inline-block w-2 h-2 rounded-full bg-gray-600 mr-2"></span>
                            Design ${designB.id + 1}
                        </th>
                        <th class="px-4 py-3 text-center">Δ (B - A)</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    <tr class="hover:bg-gray-50">
                        <td class="px-4 py-3 font-medium text-gray-900">Mass (g)</td>
                        <td class="px-4 py-3 text-center mono-accent">${designA.mass.toFixed(2)}</td>
                        <td class="px-4 py-3 text-center mono-accent">${designB.mass.toFixed(2)}</td>
                        <td class="px-4 py-3 text-center">${formatDelta(massDelta, 'g', true)}</td>
                    </tr>
                    <tr class="hover:bg-gray-50">
                        <td class="px-4 py-3 font-medium text-gray-900">Cost (₹)</td>
                        <td class="px-4 py-3 text-center mono-accent">₹${designA.cost.toFixed(2)}</td>
                        <td class="px-4 py-3 text-center mono-accent">₹${designB.cost.toFixed(2)}</td>
                        <td class="px-4 py-3 text-center">${formatDelta(costDelta, '₹', true)}</td>
                    </tr>
                    <tr class="hover:bg-gray-50">
                        <td class="px-4 py-3 font-medium text-gray-900">Safety Factor</td>
                        <td class="px-4 py-3 text-center mono-accent">${safetyA.toFixed(2)}</td>
                        <td class="px-4 py-3 text-center mono-accent">${safetyB.toFixed(2)}</td>
                        <td class="px-4 py-3 text-center">${formatPercent(safetyDeltaPercent)}</td>
                    </tr>
                    <tr class="hover:bg-gray-50">
                        <td class="px-4 py-3 font-medium text-gray-900">Print Score</td>
                        <td class="px-4 py-3 text-center mono-accent">${designA.print_score || 0}/100</td>
                        <td class="px-4 py-3 text-center mono-accent">${designB.print_score || 0}/100</td>
                        <td class="px-4 py-3 text-center">${formatDelta(printScoreDelta, '', false)}</td>
                    </tr>
                    <tr class="hover:bg-gray-50">
                        <td class="px-4 py-3 font-medium text-gray-900">CO₂ (kg)</td>
                        <td class="px-4 py-3 text-center mono-accent">${(designA.co2_kg || 0).toFixed(3)}</td>
                        <td class="px-4 py-3 text-center mono-accent">${(designB.co2_kg || 0).toFixed(3)}</td>
                        <td class="px-4 py-3 text-center">${formatDelta(co2Delta, 'kg', true)}</td>
                    </tr>
                    <tr class="hover:bg-gray-50">
                        <td class="px-4 py-3 font-medium text-gray-900">Efficiency</td>
                        <td class="px-4 py-3 text-center mono-accent">${(designA.efficiency_index || 0).toFixed(2)}</td>
                        <td class="px-4 py-3 text-center mono-accent">${(designB.efficiency_index || 0).toFixed(2)}</td>
                        <td class="px-4 py-3 text-center">${formatDelta(efficiencyDelta, '', false)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="mt-3 text-xs text-gray-700 surface-tile bg-gray-50 border border-gray-300 p-3 rounded-xl">
            <strong class="text-gray-900">💡 Interpretation:</strong>
            <span class="text-gray-900"> Dark values</span> signal improvement, 
            <span class="text-gray-600">lighter values</span> indicate regression (lower mass/cost/CO₂ are better).
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
    scene.background = new THREE.Color(0xF9FAFB);

    // Camera
    camera = new THREE.PerspectiveCamera(45, initialWidth / initialHeight, 0.1, 1000);
    camera.position.set(80, 80, 80);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(initialWidth, initialHeight);
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x666666, 0.8);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xFFFFFF, 0.9);
    directionalLight1.position.set(1, 1, 1);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xFFFFFF, 0.5);
    directionalLight2.position.set(-1, -1, -1);
    scene.add(directionalLight2);

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Add grid
    const gridHelper = new THREE.GridHelper(100, 10, 0xCCCCCC, 0xE5E7EB);
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
    const loader = new THREE.STLLoader();
    const modelUrl = `${API_BASE_URL}/models/${filename}`;

    loader.load(
        modelUrl,
        function (geometry) {
            // Remove previous mesh
            if (currentMesh) {
                scene.remove(currentMesh);
            }

            // Create material - dark gray for white background
            const material = new THREE.MeshPhongMaterial({
                color: 0x333333,
                specular: 0x888888,
                shininess: 100,
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
        },
        function (xhr) {
            // Progress tracking removed for production
        },
        function (error) {
            // Error logging minimized for production
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
    // Show mentor container, hide placeholder
    document.getElementById('mentor-container').classList.remove('hidden');
    document.getElementById('mentor-placeholder').classList.add('hidden');

    // Display generation log
    const logDiv = document.getElementById('mentor-log');
    if (results.mentor_log && results.mentor_log.length > 0) {
        logDiv.innerHTML = results.mentor_log
            .map(log => `
                <div class="flex items-start gap-3 p-2 rounded-xl transition bg-gray-50 hover:bg-gray-100">
                    <span class="text-gray-700 text-sm">▸</span>
                    <span class="text-xs text-gray-700 leading-relaxed">${log}</span>
                </div>
            `)
            .join('');

        // Auto-scroll to bottom
        logDiv.scrollTop = logDiv.scrollHeight;
    } else {
        logDiv.innerHTML = '<p class="text-gray-500 text-xs">No generation logs available</p>';
    }

    // Display summary
    const summaryDiv = document.getElementById('mentor-summary');
    if (results.mentor_summary) {
        summaryDiv.textContent = results.mentor_summary;
    } else {
        summaryDiv.innerHTML = '<p class="text-gray-500 text-sm">No summary insights available</p>';
    }

    // Auto-expand AI Mentor section
    const section = document.getElementById('mentor-section');
    const icon = document.getElementById('mentor-toggle-icon');
    if (section && section.classList.contains('hidden')) {
        section.classList.remove('hidden');
        if (icon) icon.textContent = '▲';
    }
}

/**
 * Populate the designs comparison table
 */
function populateDesignsTable(designs) {
    const tbody = document.getElementById('designs-table-body');

    tbody.innerHTML = designs.map(design => {
        const score = design.print_score || 0;
        let badgeClass = 'bg-gray-100 border border-gray-400 text-gray-900';
        if (score < 60) badgeClass = 'bg-gray-200 border border-gray-500 text-gray-700';
        else if (score < 80) badgeClass = 'bg-gray-150 border border-gray-450 text-gray-800';

        const co2 = design.co2_kg || 0;
        const efficiency = design.efficiency_index || 0;

        return `
            <tr class="hover:bg-gray-50 cursor-pointer transition" onclick="selectDesignById(${design.id})">
                <td class="px-3 py-3 mono-accent text-gray-700">${design.id + 1}</td>
                <td class="px-3 py-3 mono-accent text-gray-900">${design.mass.toFixed(2)}</td>
                <td class="px-3 py-3 mono-accent text-gray-900">₹${design.cost.toFixed(2)}</td>
                <td class="px-3 py-3">
                    <span class="px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-2 ${badgeClass}">
                        ${score}/100
                    </span>
                </td>
                <td class="px-3 py-3 text-gray-900 font-semibold mono-accent">${co2.toFixed(3)}</td>
                <td class="px-3 py-3 font-semibold mono-accent text-gray-900">${efficiency.toFixed(2)}</td>
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
    const modal = document.getElementById('advisor-modal');
    modal.style.display = 'flex';

    // Hide results, show form
    document.getElementById('advisor-results').classList.add('hidden');
}

/**
 * Close material advisor modal
 */
function closeMaterialAdvisor() {
    const modal = document.getElementById('advisor-modal');
    modal.style.display = 'none';
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
